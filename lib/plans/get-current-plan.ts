import { prisma } from "@/lib/db";
import type { PlanKey } from "@/lib/plans/config";

/**
 * Resolves the plan a user (or anonymous visitor) is on. Anonymous
 * visitors are always FREE. Signed-in users read their Subscription row —
 * ADMIN accounts always resolve to the top tier regardless of billing
 * state, so the site owner/support staff are never blocked by their own
 * plan gates.
 */
export async function getCurrentPlan(userId: string | null): Promise<PlanKey> {
  if (!userId) return "FREE";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, subscription: { include: { plan: true } } },
  });

  if (user?.role === "ADMIN") return "ENTERPRISE";

  if (user?.subscription && user.subscription.status === "ACTIVE") {
    return user.subscription.plan.key;
  }

  return "FREE";
}
