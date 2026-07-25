import { prisma } from "@/lib/db";
import { getTransport as getDefaultTransport } from "@/lib/email";
import { findField } from "@/lib/mail-merge/render-template";
import { recordUsage, getUsageToday, type UsageIdentifier } from "@/lib/usage-tracking";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/config";
import { registerJob } from "@/lib/mail-merge/job-registry";
import type { Recipient } from "@/lib/mail-merge/parse-recipients";

export type MailMergeAttachment = { filename: string; content: Buffer };

/**
 * Entered fresh on the Mail Merge page for this one job — see
 * lib/security-notes.md-style comment below. Never written to the
 * database, never logged. Held only in the in-memory job registry for the
 * lifetime of this job's send, then discarded (evicted on completion or
 * idle timeout — see lib/mail-merge/job-registry.ts).
 */
export type TransientSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName?: string;
};

export type SendJobInput = {
  identifier: UsageIdentifier;
  userId: string | null;
  plan: PlanKey;
  subjectTemplate: string;
  bodyTemplate: string;
  recipients: Recipient[];
  attachments: MailMergeAttachment[];
  excelSizeBytes: number;
  smtpConfig?: TransientSmtpConfig;
};

export type SendJobResult =
  | { ok: true; jobId: string; recipientCount: number; smtpConfigured: boolean }
  | { ok: false; reason: string };

/**
 * Validates plan limits, creates the job + PENDING recipient rows, and
 * registers the attachments/SMTP config in the in-memory job registry for
 * the batch-send endpoint to pick up. Does not send anything itself —
 * sending happens in bounded concurrent batches via POST
 * /api/mail-merge/jobs/[id]/batch, driven by the client's SendProgress
 * poll loop.
 */
export async function startSendJob(input: SendJobInput): Promise<SendJobResult> {
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
      bodyTemplate: input.bodyTemplate,
      senderEmail: input.smtpConfig?.fromEmail ?? null,
      recipientCount: input.recipients.length,
      attachmentCount: input.attachments.length,
      recipients: {
        create: input.recipients.map((r) => ({
          email: r.email,
          cc: findField(r.fields, "cc") || null,
          bcc: findField(r.fields, "bcc") || null,
          status: "PENDING",
          fields: r.fields,
        })),
      },
    },
  });

  registerJob(job.id, input.attachments, input.smtpConfig);
  await recordUsage(input.identifier, input.recipients.length);

  const smtpConfigured = Boolean(input.smtpConfig) || getDefaultTransport() !== null;
  return { ok: true, jobId: job.id, recipientCount: input.recipients.length, smtpConfigured };
}
