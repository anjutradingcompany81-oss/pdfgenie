import { prisma } from "@/lib/db";
import type { PlanKey } from "@/lib/plans/config";
import type { SubscriptionStatus } from "@prisma/client";

/**
 * Single write path for turning a Razorpay subscription/payment event into
 * our Subscription + BillingHistory rows. Called from both the checkout
 * success handler (fast, optimistic) and the webhook (slow, authoritative)
 * — both describe the same real-world event, so both funnel through here
 * rather than duplicating the upsert logic.
 */
export async function syncSubscription(params: {
  userId: string;
  planKey: PlanKey;
  status: SubscriptionStatus;
  providerCustomerId: string | null;
  providerSubscriptionId: string;
  currentPeriodEnd: Date | null;
}): Promise<void> {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { key: params.planKey } });

  // A fresh ACTIVE sync means either a brand-new subscription or a renewal
  // charge succeeding — either way any earlier "cancel at period end" no
  // longer applies (relevant if someone re-subscribes after cancelling).
  const cancelAtPeriodEnd = params.status === "ACTIVE" ? false : undefined;

  await prisma.subscription.upsert({
    where: { userId: params.userId },
    update: {
      planId: plan.id,
      status: params.status,
      provider: "RAZORPAY",
      providerCustomerId: params.providerCustomerId ?? undefined,
      providerSubscriptionId: params.providerSubscriptionId,
      currentPeriodEnd: params.currentPeriodEnd,
      cancelAtPeriodEnd,
    },
    create: {
      userId: params.userId,
      planId: plan.id,
      status: params.status,
      provider: "RAZORPAY",
      providerCustomerId: params.providerCustomerId,
      providerSubscriptionId: params.providerSubscriptionId,
      currentPeriodEnd: params.currentPeriodEnd,
    },
  });
}

export async function recordBillingHistory(params: {
  userId: string;
  amountCents: number;
  currency: string;
  status: string;
}): Promise<void> {
  const subscription = await prisma.subscription.findUnique({ where: { userId: params.userId } });

  await prisma.billingHistory.create({
    data: {
      userId: params.userId,
      subscriptionId: subscription?.id ?? null,
      amountCents: params.amountCents,
      currency: params.currency,
      status: params.status,
      provider: "RAZORPAY",
    },
  });
}
