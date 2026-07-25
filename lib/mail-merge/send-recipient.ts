import nodemailer, { type Transporter } from "nodemailer";
import { prisma } from "@/lib/db";
import { getTransport as getDefaultTransport, getFromAddress } from "@/lib/email";
import { renderTemplate, findField } from "@/lib/mail-merge/render-template";
import { resolveRecipientAttachmentNames } from "@/lib/mail-merge/resolve-attachments";
import type { MailMergeAttachment, TransientSmtpConfig } from "@/lib/mail-merge/send-job";

export type RecipientRow = {
  id: string;
  email: string;
  fields: Record<string, string> | null;
};

/** Builds the nodemailer transport for a job — the job's own SMTP config if it has one, else the server default. */
export function buildTransport(config?: TransientSmtpConfig): { transport: Transporter | null; from: string } {
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

/**
 * Sends (or fails) exactly one recipient and writes the result straight to
 * its MailMergeRecipient row. Shared by the batch-send route and the retry
 * route — the one place that renders, resolves attachments, calls SMTP,
 * and records messageId/durationMs, so those two callers can't drift.
 */
export async function sendRecipient(
  recipient: RecipientRow,
  subjectTemplate: string,
  bodyTemplate: string,
  attachments: MailMergeAttachment[],
  transport: Transporter | null,
  from: string,
  isRetry: boolean
): Promise<"SENT" | "FAILED"> {
  const fields = recipient.fields ?? {};
  const subject = renderTemplate(subjectTemplate, fields);
  const html = renderTemplate(bodyTemplate, fields, { escapeHtml: true });
  const cc = findField(fields, "cc") || undefined;
  const bcc = findField(fields, "bcc") || undefined;

  const uploadedFilenames = attachments.map((a) => a.filename);
  const { matched, missing } = resolveRecipientAttachmentNames(fields, uploadedFilenames);
  const attachmentNames = matched.length > 0 ? matched.join(", ") : null;
  const attachmentByName = new Map(attachments.map((a) => [a.filename, a]));

  const retryIncrement = isRetry ? { retryCount: { increment: 1 } } : {};

  if (missing.length > 0) {
    await prisma.mailMergeRecipient.update({
      where: { id: recipient.id },
      data: {
        status: "FAILED",
        error: `Attachment not found among uploaded files: ${missing.join(", ")}`,
        attachmentNames,
        ...retryIncrement,
      },
    });
    return "FAILED";
  }

  const startedAt = Date.now();
  try {
    let smtpResponse: string | null = null;
    let messageId: string | null = null;
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
      messageId = info.messageId ?? null;
    }
    await prisma.mailMergeRecipient.update({
      where: { id: recipient.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        smtpResponse,
        messageId,
        durationMs: Date.now() - startedAt,
        error: null,
        attachmentNames,
        ...retryIncrement,
      },
    });
    return "SENT";
  } catch (err) {
    await prisma.mailMergeRecipient.update({
      where: { id: recipient.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : "Unknown error",
        durationMs: Date.now() - startedAt,
        attachmentNames,
        ...retryIncrement,
      },
    });
    return "FAILED";
  }
}
