import { loadPdfjs } from "@/lib/pdf/pdfjs";

type PdfTextItem = { str?: string; hasEOL?: boolean; transform?: number[] };

/**
 * Groups a page's raw text items into lines using each item's baseline Y
 * position (falling back to pdf.js's own hasEOL flag), since pdf.js hands
 * back glyph runs in reading order but without paragraph structure. This is
 * a heuristic, not real layout reconstruction — tables, columns, and mixed
 * fonts can still come out flattened.
 */
function groupItemsIntoLines(items: PdfTextItem[]): string[] {
  const lines: string[] = [];
  let current = "";
  let lastY: number | null = null;

  for (const item of items) {
    const str = item.str ?? "";
    const y = item.transform ? item.transform[5] : null;

    if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
      lines.push(current);
      current = str;
    } else {
      current = current ? `${current}${str.startsWith(" ") || current.endsWith(" ") ? "" : " "}${str}` : str;
    }
    if (y !== null) lastY = y;

    if (item.hasEOL) {
      lines.push(current);
      current = "";
      lastY = null;
    }
  }
  if (current) lines.push(current);
  return lines.filter((line) => line.trim() !== "");
}

/** Extracts each page's text as an array of lines, in reading order. */
export async function extractLinesByPage(bytes: ArrayBuffer): Promise<string[][]> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const doc = await loadingTask.promise;
  const pages: string[][] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(groupItemsIntoLines(content.items as PdfTextItem[]));
  }

  await loadingTask.destroy();
  return pages;
}
