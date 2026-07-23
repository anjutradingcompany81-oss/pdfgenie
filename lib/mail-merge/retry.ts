import { prisma } from "@/lib/db";
import { getTransport as getDefaultTransport, getFromAddress } from "@/lib/email";
import { renderTemplate, findField } from "@/lib/mail-merge/render-template";
import { resolveRecipientAttachmentNames } from "@/lib/mail-merge/resolve-attachments";
import type { TransientSmtpConfig, MailMergeAttachment } from "@/lib/mail-merge/send-job";
import nodemailer from "nodemailer";

export type RetryResult = { retried: number; nowSent: number; stillFailed: number };

/**
 * Re-sends only the FAILED recipients of a job, re-rendering from the
 * job's stored bodyTemplate + each recipient's saved field snapshot.
 * Attachment file *content* is never persisted (only attachmentCount), so
 * if the original job had attachments, the caller must re-upload them —
 * otherwise this retries without attachments.
 */
export async function retryFailedRecipients(
  jobId: string,
  attachments: MailMergeAttachment[],
  smtpConfig?: TransientSmtpConfig
): Promise<RetryResult | null> {
  const job = await prisma.mailMergeJob.findUnique({
    where: { id: jobId },
    include: { recipients: { where: { status: "FAILED" } } },
  });
  if (!job) return null;

  const transport = smtpConfig
    ? nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure,
        auth: { user: smtpConfig.user, pass: smtpConfig.password },
      })
    : getDefaultTransport();
  const from = smtpConfig
    ? smtpConfig.fromName
      ? `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`
      : smtpConfig.fromEmail
    : getFromAddress();

  const attachmentByName = new Map(attachments.map((a) => [a.filename, a]));
  const uploadedFilenames = attachments.map((a) => a.filename);
  let nowSent = 0;
  let stillFailed = 0;

  for (const recipient of job.recipients) {
    const fields = (recipient.fields as Record<string, string> | null) ?? {};
    const subject = renderTemplate(job.subject, fields);
    const html = renderTemplate(job.bodyTemplate, fields);
    const cc = findField(fields, "cc") || undefined;
    const bcc = findField(fields, "bcc") || undefined;

    const { matched, missing } = resolveRecipientAttachmentNames(fields, uploadedFilenames);
    const attachmentNames = matched.length > 0 ? matched.join(", ") : null;

    if (missing.length > 0) {
      await prisma.mailMergeRecipient.update({
        where: { id: recipient.id },
        data: {
          error: `Attachment not found among uploaded files: ${missing.join(", ")}`,
          attachmentNames,
          retryCount: { increment: 1 },
        },
      });
      stillFailed++;
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
      await prisma.mailMergeRecipient.update({
        where: { id: recipient.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          smtpResponse,
          error: null,
          attachmentNames,
          retryCount: { increment: 1 },
        },
      });
      nowSent++;
    } catch (err) {
      await prisma.mailMergeRecipient.update({
        where: { id: recipient.id },
        data: {
          error: err instanceof Error ? err.message : "Unknown error",
          attachmentNames,
          retryCount: { increment: 1 },
        },
      });
      stillFailed++;
    }
  }

  const remainingFailed = await prisma.mailMergeRecipient.count({
    where: { jobId, status: "FAILED" },
  });
  await prisma.mailMergeJob.update({
    where: { id: jobId },
    data: { status: remainingFailed === 0 ? "COMPLETED" : "FAILED" },
  });

  return { retried: job.recipients.length, nowSent, stillFailed };
}
