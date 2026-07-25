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
