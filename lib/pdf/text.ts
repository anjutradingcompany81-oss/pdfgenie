import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { loadPdfjs } from "@/lib/pdf/pdfjs";

export async function extractText(bytes: ArrayBuffer): Promise<string> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const doc = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string }>;
    pageTexts.push(items.map((item) => item.str ?? "").join(" "));
  }

  await loadingTask.destroy();
  return pageTexts.join("\n\n");
}

const PAGE_WIDTH = 595.28; // A4 portrait, in points
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const FONT_SIZE = 12;
const LINE_HEIGHT = FONT_SIZE * 1.4;

function wrapParagraph(paragraph: string, font: PDFFont, maxWidth: number): string[] {
  if (paragraph.trim() === "") return [""];
  const words = paragraph.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(candidate, FONT_SIZE) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function textToPdf(text: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  const lines = text.split("\n").flatMap((paragraph) => wrapParagraph(paragraph, font, maxWidth));

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  for (const line of lines) {
    if (y < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText(line, { x: MARGIN, y, size: FONT_SIZE, font, color: rgb(0.09, 0.075, 0.06) });
    y -= LINE_HEIGHT;
  }

  return doc.save();
}
