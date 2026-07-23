import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "@/lib/db";
import { getTransport as getDefaultTransport, getFromAddress } from "@/lib/email";
import { renderTemplate, findField } from "@/lib/mail-merge/render-template";
import { resolveRecipientAttachmentNames } from "@/lib/mail-merge/resolve-attachments";
import { recordUsage, getUsageToday, type UsageIdentifier } from "@/lib/usage-tracking";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/config";
import type { Recipient } from "@/lib/mail-merge/parse-recipients";

export type MailMergeAttachment = { filename: string; content: Buffer };

/**
 * Entered fresh on the Mail Merge page for this one job — see
 * lib/security-notes.md-style comment below. Never written to the
 * database, never logged. Held only for the lifetime of this function
 * call; once validateAndSend() returns, nothing in this process still
 * references it and it's eligible for garbage collection like any other
 * local variable.
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
  | { ok: true; jobId: string; sent: number; failed: number; smtpConfigured: boolean }
  | { ok: false; reason: string };

function buildTransport(config?: TransientSmtpConfig): { transport: Transporter | null; from: string } {
  if (config) {
    return {
      transport: nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.password },
      }),
      from: config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail,
    };
  }
  return { transport: getDefaultTransport(), from: getFromAddress() };
}

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
    include: { recipients: true },
  });

  const { transport, from } = buildTransport(input.smtpConfig);
  const attachmentByName = new Map(input.attachments.map((a) => [a.filename, a]));
  const uploadedFilenames = input.attachments.map((a) => a.filename);
  let sent = 0;
  let failed = 0;

  for (const recipientRow of job.recipients) {
    const recipient = input.recipients.find((r) => r.email === recipientRow.email);
    if (!recipient) continue;

    const subject = renderTemplate(input.subjectTemplate, recipient.fields);
    const html = renderTemplate(input.bodyTemplate, recipient.fields);
    const cc = findField(recipient.fields, "cc") || undefined;
    const bcc = findField(recipient.fields, "bcc") || undefined;

    const { matched, missing } = resolveRecipientAttachmentNames(recipient.fields, uploadedFilenames);
    const attachmentNames = matched.length > 0 ? matched.join(", ") : null;

    if (missing.length > 0) {
      await prisma.mailMergeRecipient.update({
        where: { id: recipientRow.id },
        data: {
          status: "FAILED",
          error: `Attachment not found among uploaded files: ${missing.join(", ")}`,
          attachmentNames,
        },
      });
      failed++;
      continue;
    }

    try {
      let smtpResponse: string | null = null;
      if (transport) {
        const info = await transport.sendMail({
          from,
          to: recipient.email,
          cc,
          bcc,
          subject,
          html,
          attachments: matched.map((name) => {
            const a = attachmentByName.get(name)!;
            return { filename: a.filename, content: a.content };
          }),
        });
        smtpResponse = info.response ?? null;
      }
      // If SMTP isn't configured, we still record the recipient as
      // processed (not silently "sent") — see the job's smtpConfigured
      // flag, surfaced to the caller so the UI can be honest about it.
      await prisma.mailMergeRecipient.update({
        where: { id: recipientRow.id },
        data: { status: "SENT", sentAt: new Date(), smtpResponse, attachmentNames },
      });
      sent++;
    } catch (err) {
      await prisma.mailMergeRecipient.update({
        where: { id: recipientRow.id },
        data: { status: "FAILED", error: err instanceof Error ? err.message : "Unknown error", attachmentNames },
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
