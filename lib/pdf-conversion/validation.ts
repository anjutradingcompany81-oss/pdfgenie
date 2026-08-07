import { ConversionError } from "./types";

const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

function getMaxSizeBytes(): number {
  const mb = Number(process.env.MAX_PDF_SIZE_MB) || 100;
  return mb * 1024 * 1024;
}

export function getMaxPages(): number {
  return Number(process.env.MAX_PDF_PAGES) || 500;
}

/**
 * MIME type, extension, size, and magic-byte checks — cheap, synchronous
 * gates that reject obviously-wrong uploads before anything touches disk or
 * an external API. Deep PDF parsing (page count, encryption) happens
 * separately in analyze.ts, since that requires actually opening the file.
 */
export function validateUpload(file: { name: string; type: string; size: number }, bytes: Uint8Array): void {
  const hasPdfExtension = /\.pdf$/i.test(file.name);
  const hasPdfMime = file.type === "application/pdf" || file.type === "";
  if (!hasPdfExtension || !hasPdfMime) {
    throw new ConversionError("INVALID_FILE", "Only PDF files are supported.");
  }

  const maxSize = getMaxSizeBytes();
  if (file.size > maxSize) {
    throw new ConversionError("FILE_TOO_LARGE", `File exceeds the maximum allowed size (${Math.round(maxSize / (1024 * 1024))}MB).`);
  }

  const header = bytes.subarray(0, PDF_MAGIC_BYTES.length);
  const looksLikePdf = PDF_MAGIC_BYTES.every((byte, i) => header[i] === byte);
  if (!looksLikePdf) {
    throw new ConversionError("INVALID_FILE", "That file doesn't look like a valid PDF.");
  }
}

/** Strips path separators and anything but a conservative character set — the sanitized name is used only for the download filename, never as a real filesystem path (jobs are stored under a random UUID directory). */
export function sanitizeFileNameForDownload(name: string): string {
  const base = name.replace(/\.pdf$/i, "");
  const cleaned = base.replace(/[/\\?%*:|"<>]/g, "").trim();
  return cleaned.slice(0, 150) || "document";
}
