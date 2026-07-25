import { findField } from "@/lib/mail-merge/render-template";

const ATTACHMENT_COLUMN = "attachment";

/** Splits a cell like "invoice.pdf, terms.pdf" into trimmed filenames. */
function splitAttachmentNames(value: string): string[] {
  return value
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Resolves which uploaded attachment(s) apply to one recipient.
 *
 * If the recipient's row has no "Attachment" column at all, every uploaded
 * file goes to every recipient (the original, simpler behavior). Once an
 * "Attachment" column is present, it takes over per-recipient: the cell's
 * filename(s) are matched case-insensitively against the uploaded files,
 * an empty cell means no attachment for that row, and a name that doesn't
 * match anything uploaded is reported back as "missing" so the sender can
 * catch a typo or a forgotten upload instead of an email silently going
 * out without its attachment.
 */
export function resolveRecipientAttachmentNames(
  fields: Record<string, string>,
  uploadedFilenames: string[]
): { matched: string[]; missing: string[] } {
  const cell = findField(fields, ATTACHMENT_COLUMN);
  if (cell === undefined) {
    return { matched: uploadedFilenames, missing: [] };
  }

  const wanted = splitAttachmentNames(cell);
  if (wanted.length === 0) {
    return { matched: [], missing: [] };
  }

  const byLowerName = new Map(uploadedFilenames.map((f) => [f.trim().toLowerCase(), f]));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const name of wanted) {
    let found = byLowerName.get(name.toLowerCase());
    // Recipients often reference the file without an extension (e.g.
    // "invoice_john" instead of "invoice_john.pdf") — try that before
    // giving up, since every uploaded attachment here is a PDF.
    if (!found && !name.toLowerCase().endsWith(".pdf")) {
      found = byLowerName.get(`${name.toLowerCase()}.pdf`);
    }
    if (found) matched.push(found);
    else missing.push(name);
  }
  return { matched, missing };
}

/**
 * Aggregate-level companion to resolveRecipientAttachmentNames: finds
 * uploaded files that no recipient row references at all ("extra") and
 * uploaded filenames that were provided more than once ("duplicate"), for
 * the validation report shown before sending.
 */
export function findExtraAndDuplicateFiles(
  recipients: { fields: Record<string, string> }[],
  uploadedFilenames: string[]
): { extra: string[]; duplicates: string[] } {
  const lowerCounts = new Map<string, number>();
  for (const name of uploadedFilenames) {
    const key = name.trim().toLowerCase();
    lowerCounts.set(key, (lowerCounts.get(key) ?? 0) + 1);
  }
  const duplicates = uploadedFilenames.filter((name) => (lowerCounts.get(name.trim().toLowerCase()) ?? 0) > 1);

  const referenced = new Set<string>();
  for (const r of recipients) {
    const { matched } = resolveRecipientAttachmentNames(r.fields, uploadedFilenames);
    for (const name of matched) referenced.add(name.trim().toLowerCase());
  }
  const hasAttachmentColumn = recipients.some((r) => findField(r.fields, ATTACHMENT_COLUMN) !== undefined);
  const extra = hasAttachmentColumn
    ? uploadedFilenames.filter((name) => !referenced.has(name.trim().toLowerCase()))
    : [];

  return { extra, duplicates: [...new Set(duplicates)] };
}
