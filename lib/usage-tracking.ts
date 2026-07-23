import { prisma } from "@/lib/db";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/config";

export type UsageIdentifier = { type: "USER" | "ANONYMOUS"; id: string };

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

function monthPrefix(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM, UTC
}

export async function getUsageToday(identifier: UsageIdentifier) {
  const row = await prisma.usageCounter.findUnique({
    where: {
      identifierType_identifier_date: {
        identifierType: identifier.type,
        identifier: identifier.id,
        date: todayKey(),
      },
    },
  });
  return { emailsSent: row?.emailsSent ?? 0, jobsCount: row?.jobsCount ?? 0 };
}

export async function getUsageThisMonth(identifier: UsageIdentifier): Promise<number> {
  const rows = await prisma.usageCounter.findMany({
    where: {
      identifierType: identifier.type,
      identifier: identifier.id,
      date: { startsWith: monthPrefix() },
    },
    select: { emailsSent: true },
  });
  return rows.reduce((sum, r) => sum + r.emailsSent, 0);
}

export async function getLastJob(identifier: UsageIdentifier) {
  const where =
    identifier.type === "USER" ? { userId: identifier.id } : { anonymousId: identifier.id };
  return prisma.mailMergeJob.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    select: { recipientCount: true },
  });
}

export async function recordUsage(identifier: UsageIdentifier, emailsSent: number): Promise<void> {
  const date = todayKey();
  await prisma.usageCounter.upsert({
    where: {
      identifierType_identifier_date: {
        identifierType: identifier.type,
        identifier: identifier.id,
        date,
      },
    },
    create: {
      identifierType: identifier.type,
      identifier: identifier.id,
      date,
      emailsSent,
      jobsCount: 1,
    },
    update: {
      emailsSent: { increment: emailsSent },
      jobsCount: { increment: 1 },
    },
  });
}

export type UsageSummary = {
  plan: PlanKey;
  emailsSentToday: number;
  maxEmailsPerDay: number;
  remainingToday: number;
  unlimited: boolean;
  emailsSentThisMonth: number;
  currentJobEmailCount: number;
  maxEmailsPerJob: number;
};

export async function getUsageSummary(
  identifier: UsageIdentifier,
  plan: PlanKey
): Promise<UsageSummary> {
  const [{ emailsSent }, emailsSentThisMonth, lastJob] = await Promise.all([
    getUsageToday(identifier),
    getUsageThisMonth(identifier),
    getLastJob(identifier),
  ]);
  const limits = PLAN_LIMITS[plan];
  const unlimited = limits.maxEmailsPerDay === -1;

  return {
    emailsSentThisMonth,
    currentJobEmailCount: lastJob?.recipientCount ?? 0,
    maxEmailsPerJob: limits.maxEmailsPerJob,
    plan,
    emailsSentToday: emailsSent,
    maxEmailsPerDay: limits.maxEmailsPerDay,
    remainingToday: unlimited ? -1 : Math.max(0, limits.maxEmailsPerDay - emailsSent),
    unlimited,
  };
}
