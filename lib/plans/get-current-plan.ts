import { prisma } from "@/lib/db";
import type { PlanKey } from "@/lib/plans/config";
import { isAdminGrantExpired } from "@/lib/plans/subscription-expiry";

/**
 * Resolves the plan a user (or anonymous visitor) is on. Anonymous
 * visitors are always FREE. Signed-in users read their Subscription row —
 * ADMIN accounts always resolve to the top tier regardless of billing
 * state, so the site owner/support staff are never blocked by their own
 * plan gates. An admin-granted trial that's past its currentPeriodEnd is
 * treated as expired here (lazily, at read time) rather than relying on
 * a scheduled job to flip it.
 */
export async function getCurrentPlan(userId: string | null): Promise<PlanKey> {
  if (!userId) return "FREE";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, subscription: { include: { plan: true } } },
  });

  if (user?.role === "ADMIN") return "ENTERPRISE";

  if (
    user?.subscription &&
    user.subscription.status === "ACTIVE" &&
    !isAdminGrantExpired(user.subscription)
  ) {
    return user.subscription.plan.key;
  }

  return "FREE";
}
