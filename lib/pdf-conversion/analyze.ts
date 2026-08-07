import { PDFDocument, PDFName, type PDFPage } from "pdf-lib";
import { ConversionError, type PdfAnalysis } from "./types";
import { getMaxPages } from "./validation";

/**
 * Server-side PDF analysis using pdf-lib only (no pdfjs-dist server-side —
 * that needs a worker/DOM setup this app has never run outside the
 * browser). This is enough to catch encryption and page-count limits before
 * spending an API call, and to give the UI an honest "this looks scanned"
 * hint. It does NOT decide whether OCR runs — Adobe's export operation
 * already applies OCR to image-only pages on its own, so this is purely
 * informational, never a gate on which API call gets made.
 */
export async function analyzePDF(bytes: Uint8Array): Promise<PdfAnalysis> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } catch {
    throw new ConversionError("CORRUPTED_PDF", "This PDF appears to be corrupted or isn't a valid PDF.");
  }

  const encrypted = doc.isEncrypted;
  const pageCount = doc.getPageCount();

  const maxPages = getMaxPages();
  if (pageCount > maxPages) {
    throw new ConversionError("TOO_MANY_PAGES", `This PDF has ${pageCount} pages — the limit is ${maxPages}.`);
  }

  // Best-effort per-page heuristic: a page whose content stream contains a
  // text-showing operator (Tj/TJ/'/") has real selectable text; a page with
  // none is probably a scanned image, even if we can't be fully certain
  // without a real text-layer parse.
  let scannedPageCount = 0;
  if (!encrypted) {
    for (const page of doc.getPages()) {
      const hasText = pageHasTextOperators(page);
      if (!hasText) scannedPageCount += 1;
    }
  }

  const hasDigitalText = encrypted ? true : scannedPageCount < pageCount;
  const isScanned = !encrypted && pageCount > 0 && scannedPageCount === pageCount;
  const isMixed = !encrypted && scannedPageCount > 0 && scannedPageCount < pageCount;

  return {
    pageCount,
    fileSizeBytes: bytes.byteLength,
    encrypted,
    hasDigitalText,
    scannedPageCount,
    isScanned,
    isMixed,
  };
}

// pdf-lib doesn't expose decoded content-stream text publicly in a stable
// way, so this checks whether the page references any Font resource at all
// — a coarser but reliable enough signal for a UI hint (scanned pages
// typically reference no fonts, since there's no text to draw with one).
function pageHasTextOperators(page: PDFPage): boolean {
  try {
    const resources = page.node.Resources();
    const fontDict = resources?.get(PDFName.of("Font"));
    return !!fontDict;
  } catch {
    return true; // don't misreport a page as scanned just because inspection failed
  }
}
