import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getJobIfAccessible } from "@/lib/mail-merge/job-access";
import { evictJob } from "@/lib/mail-merge/job-registry";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobIfAccessible(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (job.status !== "SENDING" && job.status !== "PAUSED") {
    return NextResponse.json({ error: "This job has already finished." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.mailMergeRecipient.updateMany({
      where: { jobId: id, status: "PENDING" },
      data: { status: "CANCELLED" },
    }),
    prisma.mailMergeJob.update({
      where: { id },
      data: { status: "CANCELLED", completedAt: new Date() },
    }),
  ]);
  evictJob(id);

  return NextResponse.json({ ok: true });
}
