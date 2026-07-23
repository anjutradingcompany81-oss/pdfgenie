import { Document, Packer, Paragraph, TextRun } from "docx";
import { loadPdfjs } from "@/lib/pdf/pdfjs";
import { textToPdf } from "@/lib/pdf/text";

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

async function extractLinesByPage(bytes: ArrayBuffer): Promise<string[][]> {
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

/**
 * Converts a PDF's selectable text into a .docx, one paragraph per detected
 * line and a page break between each original PDF page. This carries over
 * text and reading order but not layout — original fonts, tables, images,
 * and multi-column formatting aren't reconstructed.
 */
export async function pdfToWord(bytes: ArrayBuffer): Promise<Blob> {
  const pages = await extractLinesByPage(bytes);
  const hasAnyText = pages.some((lines) => lines.length > 0);
  if (!hasAnyText) {
    throw new Error("No selectable text found on this PDF — it may be a scanned image.");
  }

  const paragraphs: Paragraph[] = [];
  pages.forEach((lines, pageIndex) => {
    const pageLines = lines.length > 0 ? lines : [""];
    pageLines.forEach((line, lineIndex) => {
      const isLastLineOfDoc = pageIndex === pages.length - 1 && lineIndex === pageLines.length - 1;
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(line)],
          pageBreakBefore: false,
        })
      );
      if (lineIndex === pageLines.length - 1 && !isLastLineOfDoc) {
        paragraphs.push(new Paragraph({ children: [], pageBreakBefore: true }));
      }
    });
  });

  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBlob(doc);
}

/**
 * Converts a .docx file to PDF by extracting its text with mammoth and
 * laying it out with the same paginated-text renderer the "Text to PDF"
 * tool uses. Only .docx (OOXML) is supported — the legacy binary .doc
 * format has no viable client-side parser. Original fonts, tables, images,
 * and complex formatting aren't preserved, only text and paragraph breaks.
 */
export async function wordToPdf(bytes: ArrayBuffer): Promise<Uint8Array> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: bytes });
  const text = result.value.trim();
  if (!text) {
    throw new Error("No text found in that document.");
  }
  return textToPdf(text);
}
