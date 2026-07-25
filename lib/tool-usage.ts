import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import { getCurrentPlan } from "@/lib/plans/get-current-plan";

/**
 * Global "how many tools can you use today" gate — separate from
 * lib/usage-tracking.ts, which is Mail Merge's own per-email limit system.
 * Reuses the same UsageCounter table but under a "tools:" prefixed
 * identifier so the two never share a row/counter.
 */
const ANONYMOUS_DAILY_LIMIT = 3;
const FREE_SIGNED_IN_DAILY_LIMIT = 10;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

async function resolveToolIdentity(): Promise<{
  identifierType: "USER" | "ANONYMOUS";
  identifier: string;
  userId: string | null;
  signedIn: boolean;
}> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  if (userId) {
    return { identifierType: "USER", identifier: `tools:${userId}`, userId, signedIn: true };
  }
  const anonId = await getOrCreateAnonymousId();
  return { identifierType: "ANONYMOUS", identifier: `tools:${anonId}`, userId: null, signedIn: false };
}

export type ToolUsageStatus = {
  used: number;
  limit: number; // -1 means unlimited
  remaining: number; // -1 means unlimited
  unlimited: boolean;
  signedIn: boolean;
};

export async function getToolUsageStatus(): Promise<ToolUsageStatus> {
  const identity = await resolveToolIdentity();
  const plan = await getCurrentPlan(identity.userId);
  const unlimited = plan === "PREMIUM" || plan === "ENTERPRISE";
  const limit = unlimited ? -1 : identity.signedIn ? FREE_SIGNED_IN_DAILY_LIMIT : ANONYMOUS_DAILY_LIMIT;

  const row = await prisma.usageCounter.findUnique({
    where: {
      identifierType_identifier_date: {
        identifierType: identity.identifierType,
        identifier: identity.identifier,
        date: todayKey(),
      },
    },
  });
  const used = row?.jobsCount ?? 0;

  return {
    used,
    limit,
    remaining: unlimited ? -1 : Math.max(0, limit - used),
    unlimited,
    signedIn: identity.signedIn,
  };
}

export async function recordToolUsage(): Promise<ToolUsageStatus> {
  const identity = await resolveToolIdentity();
  const date = todayKey();
  await prisma.usageCounter.upsert({
    where: {
      identifierType_identifier_date: {
        identifierType: identity.identifierType,
        identifier: identity.identifier,
        date,
      },
    },
    create: { identifierType: identity.identifierType, identifier: identity.identifier, date, jobsCount: 1 },
    update: { jobsCount: { increment: 1 } },
  });
  return getToolUsageStatus();
}
