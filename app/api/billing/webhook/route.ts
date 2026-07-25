import { NextResponse } from "next/server";
import type { PlanKey } from "@/lib/plans/config";
import { getPaymentProvider } from "@/lib/payments";
import { syncSubscription, recordBillingHistory } from "@/lib/payments/sync-subscription";

export const runtime = "nodejs";

type SubscriptionEntity = {
  id: string;
  customer_id: string | null;
  current_end: number | null;
  notes?: { userId?: string; planKey?: string };
};

type PaymentEntity = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

const ACTIVE_EVENTS = new Set(["subscription.activated", "subscription.charged", "subscription.resumed"]);
const PAST_DUE_EVENTS = new Set(["subscription.halted", "subscription.pending"]);
const CANCELED_EVENTS = new Set(["subscription.cancelled", "subscription.paused"]);
const EXPIRED_EVENTS = new Set(["subscription.completed", "subscription.expired"]);

/**
 * Razorpay's push notification of subscription/payment state changes — the
 * authoritative writer for our Subscription table. app/api/billing/verify
 * also writes here (for instant UI feedback right after checkout) but that
 * path only ever fires once; every renewal, failed charge, or cancellation
 * flows through here for the lifetime of the subscription.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!getPaymentProvider("razorpay").verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event: string = payload.event;
  const subscription: SubscriptionEntity | undefined = payload.payload?.subscription?.entity;
  const payment: PaymentEntity | undefined = payload.payload?.payment?.entity;

  if (!subscription?.notes?.userId || !subscription.notes.planKey) {
    // Not a subscription lifecycle event we issued (e.g. a one-off payment
    // webhook) — acknowledge so Razorpay doesn't retry, nothing to do.
    return NextResponse.json({ ok: true });
  }

  const userId = subscription.notes.userId;
  const planKey = subscription.notes.planKey as PlanKey;
  const currentPeriodEnd = subscription.current_end ? new Date(subscription.current_end * 1000) : null;

  try {
    if (ACTIVE_EVENTS.has(event)) {
      await syncSubscription({
        userId,
        planKey,
        status: "ACTIVE",
        providerCustomerId: subscription.customer_id,
        providerSubscriptionId: subscription.id,
        currentPeriodEnd,
      });
      if (event === "subscription.charged" && payment) {
        await recordBillingHistory({
          userId,
          amountCents: payment.amount,
          currency: payment.currency.toLowerCase(),
          status: payment.status,
        });
      }
    } else if (PAST_DUE_EVENTS.has(event)) {
      await syncSubscription({
        userId,
        planKey,
        status: "PAST_DUE",
        providerCustomerId: subscription.customer_id,
        providerSubscriptionId: subscription.id,
        currentPeriodEnd,
      });
    } else if (CANCELED_EVENTS.has(event)) {
      await syncSubscription({
        userId,
        planKey,
        status: "CANCELED",
        providerCustomerId: subscription.customer_id,
        providerSubscriptionId: subscription.id,
        currentPeriodEnd,
      });
    } else if (EXPIRED_EVENTS.has(event)) {
      await syncSubscription({
        userId,
        planKey,
        status: "EXPIRED",
        providerCustomerId: subscription.customer_id,
        providerSubscriptionId: subscription.id,
        currentPeriodEnd,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[billing/webhook]", err);
    // 500 tells Razorpay to retry — appropriate here since the failure is
    // almost certainly transient (DB hiccup), not a malformed payload.
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
