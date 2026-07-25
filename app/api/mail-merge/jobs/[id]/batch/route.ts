import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getJobIfAccessible } from "@/lib/mail-merge/job-access";
import { getJobEntry, evictJob } from "@/lib/mail-merge/job-registry";
import { buildTransport, sendRecipient } from "@/lib/mail-merge/send-recipient";

// Bounded concurrency per poll — real parallel sending without opening so
// many SMTP connections at once that the single VPS process (or the SMTP
// provider's own rate limits) chokes.
const BATCH_SIZE = 8;

async function countByStatus(jobId: string) {
  const rows = await prisma.mailMergeRecipient.groupBy({
    by: ["status"],
    where: { jobId },
    _count: true,
  });
  const counts = { PENDING: 0, SENT: 0, FAILED: 0, CANCELLED: 0 };
  for (const row of rows) counts[row.status] = row._count;
  return counts;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobIfAccessible(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (job.status === "PAUSED") {
    const counts = await countByStatus(id);
    return NextResponse.json({ ok: true, done: false, paused: true, batch: { sent: 0, failed: 0 }, counts });
  }
  if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
    const counts = await countByStatus(id);
    return NextResponse.json({ ok: true, done: true, paused: false, batch: { sent: 0, failed: 0 }, counts });
  }

  const entry = getJobEntry(id);
  if (!entry) {
    // The registry entry is gone (process restart, or evicted after being
    // idle) but there's still work left — surface that distinctly so the
    // client can point the user at Retry instead of spinning forever.
    const pendingCount = await prisma.mailMergeRecipient.count({ where: { jobId: id, status: "PENDING" } });
    if (pendingCount > 0) {
      await prisma.mailMergeJob.update({ where: { id }, data: { status: "PAUSED" } });
      return NextResponse.json({ ok: false, code: "REGISTRY_LOST" }, { status: 409 });
    }
    const counts = await countByStatus(id);
    return NextResponse.json({ ok: true, done: true, paused: false, batch: { sent: 0, failed: 0 }, counts });
  }

  const pending = await prisma.mailMergeRecipient.findMany({
    where: { jobId: id, status: "PENDING" },
    take: BATCH_SIZE,
  });

  if (pending.length === 0) {
    const counts = await countByStatus(id);
    const finalStatus = counts.SENT === 0 && counts.CANCELLED === 0 ? "FAILED" : "COMPLETED";
    await prisma.mailMergeJob.update({ where: { id }, data: { status: finalStatus, completedAt: new Date() } });
    evictJob(id);
    return NextResponse.json({ ok: true, done: true, batch: { sent: 0, failed: 0 }, counts });
  }

  const { transport, from } = buildTransport(entry.smtpConfig);
  const results = await Promise.all(
    pending.map((recipient) =>
      sendRecipient(
        { id: recipient.id, email: recipient.email, fields: recipient.fields as Record<string, string> | null },
        job.subject,
        job.bodyTemplate,
        entry.attachments,
        transport,
        from,
        false
      )
    )
  );

  const batchSent = results.filter((r) => r === "SENT").length;
  const batchFailed = results.filter((r) => r === "FAILED").length;
  const counts = await countByStatus(id);
  const done = counts.PENDING === 0;

  if (done) {
    const finalStatus = counts.SENT === 0 && counts.CANCELLED === 0 ? "FAILED" : "COMPLETED";
    await prisma.mailMergeJob.update({ where: { id }, data: { status: finalStatus, completedAt: new Date() } });
    evictJob(id);
  }

  return NextResponse.json({ ok: true, done, paused: false, batch: { sent: batchSent, failed: batchFailed }, counts });
}
