export const SITE_URL = "https://pdfgenie.in";
export const SITE_NAME = "PDF Genie";
export const SITE_DESCRIPTION =
  "Merge, split, compress, convert, and sign PDFs in seconds. No installs, no watermarks.";

/** Truncates admin-editable page body text to a meta-description-length summary. */
export function metaDescription(body: string, max = 155): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}
