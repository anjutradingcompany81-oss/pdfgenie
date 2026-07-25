import { prisma } from "@/lib/db";
import type { PlanKey } from "@/lib/plans/config";

/**
 * Admin-driven plan override — sets a user's plan directly, independent of
 * any payment gateway. Distinct from lib/payments/sync-subscription.ts,
 * which reflects real Razorpay state; this path exists for comping an
 * account, support overrides, or testing without moving real money through
 * the live key. Subscription.provider stays null to mark it as manually
 * granted rather than gateway-backed.
 */
export async function setUserPlan(userId: string, planKey: PlanKey): Promise<void> {
  if (planKey === "FREE") {
    await prisma.subscription.deleteMany({ where: { userId } });
    return;
  }

  const plan = await prisma.plan.findUniqueOrThrow({ where: { key: planKey } });

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      planId: plan.id,
      status: "ACTIVE",
      provider: null,
      providerCustomerId: null,
      providerSubscriptionId: null,
      currentPeriodEnd: null,
    },
    create: { userId, planId: plan.id, status: "ACTIVE" },
  });
}

const TRIAL_DAYS = 30;

/**
 * Admin-only: grants Pro access for 30 days from today, free of charge.
 * Same provider=null "manually granted" shape as setUserPlan, but with
 * currentPeriodEnd set — lib/plans/subscription-expiry.ts is what makes
 * that expiration actually take effect (checked lazily by getCurrentPlan,
 * no cron job needed).
 */
export async function grantTrial(userId: string): Promise<void> {
  const plan = await prisma.plan.findUniqueOrThrow({ where: { key: "PREMIUM" } });
  const currentPeriodEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { userId },
    update: {
      planId: plan.id,
      status: "ACTIVE",
      provider: null,
      providerCustomerId: null,
      providerSubscriptionId: null,
      currentPeriodEnd,
    },
    create: { userId, planId: plan.id, status: "ACTIVE", currentPeriodEnd },
  });
}
