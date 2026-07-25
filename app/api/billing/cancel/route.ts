import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setUserPlan } from "@/lib/plans/set-user-plan";

export const runtime = "nodejs";

/**
 * Cancels at the end of the already-paid period (Razorpay's
 * cancelAtCycleEnd) rather than immediately — matches the refund policy:
 * no partial-period refunds, but no surprise early cutoff either. Status
 * stays ACTIVE with cancelAtPeriodEnd=true until the real
 * subscription.cancelled webhook lands at period end.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  if (!subscription || subscription.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active subscription to cancel." }, { status: 400 });
  }
  if (subscription.cancelAtPeriodEnd) {
    return NextResponse.json({ error: "Cancellation is already scheduled." }, { status: 400 });
  }

  // Admin-granted plans (see lib/plans/set-user-plan.ts) have no real
  // gateway subscription behind them — nothing to schedule, just drop now.
  if (!subscription.provider || !subscription.providerSubscriptionId) {
    await setUserPlan(session.user.id, "FREE");
    return NextResponse.json({ ok: true, effective: "immediate" });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Billing isn't configured." }, { status: 503 });
  }

  try {
    const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    await client.subscriptions.cancel(subscription.providerSubscriptionId, true);
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: { cancelAtPeriodEnd: true },
    });
    return NextResponse.json({
      ok: true,
      effective: "period_end",
      currentPeriodEnd: subscription.currentPeriodEnd,
    });
  } catch (err) {
    console.error("[billing/cancel]", err);
    return NextResponse.json(
      { error: "Couldn't cancel — please try again or contact support." },
      { status: 500 }
    );
  }
}
