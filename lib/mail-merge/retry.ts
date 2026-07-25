import { prisma } from "@/lib/db";
import { buildTransport, sendRecipient } from "@/lib/mail-merge/send-recipient";
import { hasJobEntry } from "@/lib/mail-merge/job-registry";
import type { TransientSmtpConfig, MailMergeAttachment } from "@/lib/mail-merge/send-job";

export type RetryResult = { retried: number; nowSent: number; stillFailed: number };

/**
 * Re-sends a job's FAILED recipients, plus any still-PENDING ones — the
 * latter covers a job whose live batch-send stalled (browser tab closed,
 * the in-memory job registry got evicted) and never finished, using this
 * as the recovery path instead of a second bespoke mechanism. Re-renders
 * from the job's stored bodyTemplate + each recipient's saved field
 * snapshot. Attachment file *content* is never persisted (only
 * attachmentCount), so if the original job had attachments, the caller
 * must re-upload them — otherwise this retries without attachments.
 */
export async function retryFailedRecipients(
  jobId: string,
  attachments: MailMergeAttachment[],
  smtpConfig?: TransientSmtpConfig
): Promise<RetryResult | null | { blocked: true }> {
  const job = await prisma.mailMergeJob.findUnique({
    where: { id: jobId },
    include: { recipients: { where: { status: { in: ["FAILED", "PENDING"] } } } },
  });
  if (!job) return null;

  // A live batch-send is still actively working this job — retrying now
  // would race it and could double-send the same recipient.
  if (job.status === "SENDING" && hasJobEntry(jobId)) {
    return { blocked: true };
  }

  const { transport, from } = buildTransport(smtpConfig);

  let nowSent = 0;
  let stillFailed = 0;
  for (const recipient of job.recipients) {
    const status = await sendRecipient(
      { id: recipient.id, email: recipient.email, fields: recipient.fields as Record<string, string> | null },
      job.subject,
      job.bodyTemplate,
      attachments,
      transport,
      from,
      true
    );
    if (status === "SENT") nowSent++;
    else stillFailed++;
  }

  const remainingFailed = await prisma.mailMergeRecipient.count({
    where: { jobId, status: "FAILED" },
  });
  await prisma.mailMergeJob.update({
    where: { id: jobId },
    data: { status: remainingFailed === 0 ? "COMPLETED" : "FAILED", completedAt: new Date() },
  });

  return { retried: job.recipients.length, nowSent, stillFailed };
}
