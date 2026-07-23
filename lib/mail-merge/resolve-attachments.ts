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
    const found = byLowerName.get(name.toLowerCase());
    if (found) matched.push(found);
    else missing.push(name);
  }
  return { matched, missing };
}
