import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { PlanKey } from "@/lib/plans/config";
import { syncSubscription, recordBillingHistory } from "@/lib/payments/sync-subscription";

export const runtime = "nodejs";

/**
 * Called by the client right after the Checkout.js modal reports success —
 * gives the UI an instant "you're upgraded" instead of waiting on the
 * webhook, which usually arrives within seconds but isn't guaranteed to.
 * The webhook (app/api/billing/webhook/route.ts) remains the authoritative
 * writer for every subsequent renewal/cancellation; this route only ever
 * fires once, right after a successful authorization.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Razorpay isn't configured yet." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const paymentId = body?.razorpay_payment_id;
  const subscriptionId = body?.razorpay_subscription_id;
  const signature = body?.razorpay_signature;
  if (
    typeof paymentId !== "string" ||
    typeof subscriptionId !== "string" ||
    typeof signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing verification fields." }, { status: 400 });
  }

  // Razorpay's own SDK computes this the same way — see
  // validatePaymentVerification in razorpay/dist/utils/razorpay-utils.js —
  // built inline here since that helper isn't part of the package's public
  // (typed) API, only validateWebhookSignature is.
  const validSignature = Razorpay.validateWebhookSignature(`${paymentId}|${subscriptionId}`, signature, keySecret);
  if (!validSignature) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 400 });
  }

  try {
    const client = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: keySecret });
    const subscription = await client.subscriptions.fetch(subscriptionId);

    // The signature proves this payment/subscription pair is genuinely from
    // Razorpay — it does not prove it belongs to the signed-in user. Only
    // trust it once the userId we stamped into notes at checkout matches.
    if (subscription.notes?.userId !== session.user.id) {
      return NextResponse.json({ error: "Subscription does not belong to this account." }, { status: 403 });
    }

    const planKey = subscription.notes?.planKey as PlanKey | undefined;
    if (planKey !== "PREMIUM" && planKey !== "ENTERPRISE") {
      return NextResponse.json({ error: "Unrecognized plan on subscription." }, { status: 400 });
    }

    await syncSubscription({
      userId: session.user.id,
      planKey,
      status: subscription.status === "active" || subscription.status === "authenticated" ? "ACTIVE" : "PAST_DUE",
      providerCustomerId: subscription.customer_id,
      providerSubscriptionId: subscription.id,
      currentPeriodEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null,
    });

    const payment = await client.payments.fetch(paymentId);
    await recordBillingHistory({
      userId: session.user.id,
      amountCents: Number(payment.amount),
      currency: payment.currency.toLowerCase(),
      status: payment.status,
    });

    return NextResponse.json({ ok: true, planKey });
  } catch (err) {
    console.error("[billing/verify]", err);
    return NextResponse.json({ error: "Couldn't confirm the subscription — it will sync shortly." }, { status: 500 });
  }
}
