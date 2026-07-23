import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * A job is visible to the user who created it (by session, or by the same
 * anonymous cookie for anonymous jobs) or to an admin. Doesn't create a new
 * anonymous cookie — an anonymous visitor with no cookie yet can't own any
 * job by definition.
 */
export async function canAccessJob(job: { userId: string | null; anonymousId: string | null }) {
  const session = await auth();
  if (session?.user) {
    if (session.user.role === "ADMIN") return true;
    if (job.userId === session.user.id) return true;
    return false;
  }

  if (!job.anonymousId) return false;
  const store = await cookies();
  const anonId = store.get("pdfgenie_anon_id")?.value;
  return anonId === job.anonymousId;
}

export async function getJobIfAccessible(jobId: string) {
  const job = await prisma.mailMergeJob.findUnique({ where: { id: jobId } });
  if (!job) return null;
  const allowed = await canAccessJob(job);
  return allowed ? job : null;
}
