import { prisma } from "@/lib/db";
import type { PlanKey } from "@/lib/plans/config";

/**
 * Resolves the plan a user (or anonymous visitor) is on. Anonymous
 * visitors are always FREE. Signed-in users would read their
 * Subscription row here once billing exists — for now every user is FREE
 * too, since Subscription is never written to by any active code path
 * (see prisma/schema.prisma's comment on that model).
 */
export async function getCurrentPlan(userId: string | null): Promise<PlanKey> {
  if (!userId) return "FREE";

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    include: { plan: true },
  });

  if (subscription && subscription.status === "ACTIVE") {
    return subscription.plan.key;
  }

  return "FREE";
}
