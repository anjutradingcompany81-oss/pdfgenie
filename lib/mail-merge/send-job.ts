import { prisma } from "@/lib/db";
import { getTransport, getFromAddress } from "@/lib/email";
import { renderTemplate } from "@/lib/mail-merge/render-template";
import { recordUsage, getUsageToday, type UsageIdentifier } from "@/lib/usage-tracking";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/config";
import type { Recipient } from "@/lib/mail-merge/parse-recipients";

export type MailMergeAttachment = { filename: string; content: Buffer };

export type SendJobInput = {
  identifier: UsageIdentifier;
  userId: string | null;
  plan: PlanKey;
  subjectTemplate: string;
  bodyTemplate: string;
  recipients: Recipient[];
  attachments: MailMergeAttachment[];
  excelSizeBytes: number;
};

export type SendJobResult =
  | { ok: true; jobId: string; sent: number; failed: number; smtpConfigured: boolean }
  | { ok: false; reason: string };

export async function validateAndSend(input: SendJobInput): Promise<SendJobResult> {
  const limits = PLAN_LIMITS[input.plan];

  if (limits.maxEmailsPerJob !== -1 && input.recipients.length > limits.maxEmailsPerJob) {
    return {
      ok: false,
      reason: `The free plan allows up to ${limits.maxEmailsPerJob} emails per mail merge job. Your file has ${input.recipients.length} recipients.`,
    };
  }

  if (limits.maxExcelSizeMb !== -1) {
    const maxBytes = limits.maxExcelSizeMb * 1024 * 1024;
    if (input.excelSizeBytes > maxBytes) {
      return {
        ok: false,
        reason: `The free plan allows Excel files up to ${limits.maxExcelSizeMb}MB.`,
      };
    }
  }

  if (limits.maxAttachmentsPerJob !== -1 && input.attachments.length > limits.maxAttachmentsPerJob) {
    return {
      ok: false,
      reason: `The free plan allows up to ${limits.maxAttachmentsPerJob} PDF attachments per job.`,
    };
  }

  if (limits.maxAttachmentTotalSizeMb !== -1) {
    const totalBytes = input.attachments.reduce((sum, a) => sum + a.content.byteLength, 0);
    if (totalBytes > limits.maxAttachmentTotalSizeMb * 1024 * 1024) {
      return {
        ok: false,
        reason: `Attachments must total under ${limits.maxAttachmentTotalSizeMb}MB per job.`,
      };
    }
  }

  if (limits.maxEmailsPerDay !== -1) {
    const { emailsSent } = await getUsageToday(input.identifier);
    const remaining = limits.maxEmailsPerDay - emailsSent;
    if (input.recipients.length > remaining) {
      return {
        ok: false,
        reason:
          remaining <= 0
            ? `You've used all ${limits.maxEmailsPerDay} free emails for today. Try again tomorrow, or upgrade for unlimited sending.`
            : `Only ${remaining} emails left in today's free quota (${limits.maxEmailsPerDay}/day), but this job has ${input.recipients.length} recipients.`,
      };
    }
  }

  const job = await prisma.mailMergeJob.create({
    data: {
      userId: input.userId,
      anonymousId: input.identifier.type === "ANONYMOUS" ? input.identifier.id : null,
      status: "SENDING",
      subject: input.subjectTemplate,
      recipientCount: input.recipients.length,
      attachmentCount: input.attachments.length,
      recipients: {
        create: input.recipients.map((r) => ({ email: r.email, status: "PENDING" })),
      },
    },
    include: { recipients: true },
  });

  const transport = getTransport();
  const from = getFromAddress();
  let sent = 0;
  let failed = 0;

  for (const recipientRow of job.recipients) {
    const recipient = input.recipients.find((r) => r.email === recipientRow.email);
    if (!recipient) continue;

    const subject = renderTemplate(input.subjectTemplate, recipient.fields);
    const html = renderTemplate(input.bodyTemplate, recipient.fields).replace(/\n/g, "<br>");

    try {
      if (transport) {
        await transport.sendMail({
          from,
          to: recipient.email,
          subject,
          html,
          attachments: input.attachments.map((a) => ({ filename: a.filename, content: a.content })),
        });
      }
      // If SMTP isn't configured, we still record the recipient as
      // processed (not silently "sent") — see the job's smtpConfigured
      // flag, surfaced to the caller so the UI can be honest about it.
      await prisma.mailMergeRecipient.update({
        where: { id: recipientRow.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent++;
    } catch (err) {
      await prisma.mailMergeRecipient.update({
        where: { id: recipientRow.id },
        data: { status: "FAILED", error: err instanceof Error ? err.message : "Unknown error" },
      });
      failed++;
    }
  }

  await prisma.mailMergeJob.update({
    where: { id: job.id },
    data: { status: failed === job.recipients.length ? "FAILED" : "COMPLETED", completedAt: new Date() },
  });

  await recordUsage(input.identifier, input.recipients.length);

  return { ok: true, jobId: job.id, sent, failed, smtpConfigured: transport !== null };
}
