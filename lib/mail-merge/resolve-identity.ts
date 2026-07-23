import { auth } from "@/lib/auth";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import { getCurrentPlan } from "@/lib/plans/get-current-plan";
import type { UsageIdentifier } from "@/lib/usage-tracking";

export async function resolveIdentity(): Promise<{
  userId: string | null;
  identifier: UsageIdentifier;
  plan: Awaited<ReturnType<typeof getCurrentPlan>>;
}> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const identifier: UsageIdentifier = userId
    ? { type: "USER", id: userId }
    : { type: "ANONYMOUS", id: await getOrCreateAnonymousId() };

  const plan = await getCurrentPlan(userId);

  return { userId, identifier, plan };
}
