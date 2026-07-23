import * as XLSX from "xlsx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/db";
import { findField } from "@/lib/mail-merge/render-template";

export type LogRow = {
  date: string;
  time: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  cc: string;
  bcc: string;
  subject: string;
  attachmentName: string;
  pdfPasswordUsed: string;
  deliveryStatus: string;
  smtpResponse: string;
  errorMessage: string;
  retryCount: number;
  deliveryTimestamp: string;
};

export function logFilename(ext: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(
    now.getHours()
  )}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  return `MailMerge_${stamp}.${ext}`;
}

export async function getJobLogRows(jobId: string): Promise<{ job: { attachmentCount: number }; rows: LogRow[] } | null> {
  const job = await prisma.mailMergeJob.findUnique({
    where: { id: jobId },
    include: { recipients: true },
  });
  if (!job) return null;

  const rows: LogRow[] = job.recipients.map((r) => {
    const fields = (r.fields as Record<string, string> | null) ?? {};
    const timestamp = r.sentAt ?? job.createdAt;
    const pdfPassword = findField(fields, "pdf password");

    return {
      date: timestamp.toISOString().slice(0, 10),
      time: timestamp.toISOString().slice(11, 19),
      senderEmail: job.senderEmail || "(default sender)",
      recipientName: findField(fields, "name") || findField(fields, "employee name") || "",
      recipientEmail: r.email,
      cc: r.cc || "",
      bcc: r.bcc || "",
      subject: job.subject,
      attachmentName: r.attachmentNames || "",
      pdfPasswordUsed: pdfPassword ? "••••••" : "",
      deliveryStatus: r.status,
      smtpResponse: r.smtpResponse || "",
      errorMessage: r.error || "",
      retryCount: r.retryCount,
      deliveryTimestamp: timestamp.toISOString(),
    };
  });

  return { job: { attachmentCount: job.attachmentCount }, rows };
}

const COLUMN_LABELS: Record<keyof LogRow, string> = {
  date: "Date",
  time: "Time",
  senderEmail: "Sender Email",
  recipientName: "Recipient Name",
  recipientEmail: "Recipient Email",
  cc: "CC",
  bcc: "BCC",
  subject: "Subject",
  attachmentName: "Attachment Name",
  pdfPasswordUsed: "PDF Password Used",
  deliveryStatus: "Delivery Status",
  smtpResponse: "SMTP Response",
  errorMessage: "Error Message",
  retryCount: "Retry Count",
  deliveryTimestamp: "Delivery Timestamp",
};

function toLabeledRows(rows: LogRow[]): Record<string, string | number>[] {
  return rows.map((row) => {
    const labeled: Record<string, string | number> = {};
    for (const key of Object.keys(COLUMN_LABELS) as (keyof LogRow)[]) {
      labeled[COLUMN_LABELS[key]] = row[key];
    }
    return labeled;
  });
}

export function logToXlsx(rows: LogRow[]): Buffer {
  const ws = XLSX.utils.json_to_sheet(toLabeledRows(rows));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Mail Merge Log");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function logToCsv(rows: LogRow[]): string {
  const ws = XLSX.utils.json_to_sheet(toLabeledRows(rows));
  return XLSX.utils.sheet_to_csv(ws);
}

export function logToJson(rows: LogRow[]): string {
  return JSON.stringify(rows, null, 2);
}

export async function logToPdf(rows: LogRow[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 841.89; // A4 landscape
  const pageHeight = 595.28;
  const margin = 30;
  const fontSize = 7;
  const lineHeight = fontSize * 1.6;

  const columns: (keyof LogRow)[] = [
    "recipientEmail",
    "recipientName",
    "deliveryStatus",
    "subject",
    "attachmentName",
    "retryCount",
    "deliveryTimestamp",
    "errorMessage",
  ];
  const colWidth = (pageWidth - margin * 2) / columns.length;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function drawHeader() {
    columns.forEach((col, i) => {
      page.drawText(COLUMN_LABELS[col], {
        x: margin + i * colWidth,
        y,
        size: fontSize,
        font: boldFont,
        color: rgb(0.09, 0.075, 0.06),
      });
    });
    y -= lineHeight;
  }

  drawHeader();

  for (const row of rows) {
    if (y < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeader();
    }
    columns.forEach((col, i) => {
      const text = String(row[col] ?? "").slice(0, Math.floor(colWidth / 4));
      page.drawText(text, {
        x: margin + i * colWidth,
        y,
        size: fontSize,
        font,
        color: rgb(0.2, 0.18, 0.16),
      });
    });
    y -= lineHeight;
  }

  return doc.save();
}
