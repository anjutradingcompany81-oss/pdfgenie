import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type TextAnnotation = {
  pageIndex: number;
  /** Ratio (0-1) of page width/height, top-left origin — matches on-screen preview coordinates. */
  xRatio: number;
  yRatio: number;
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
};

export async function applyTextAnnotations(
  bytes: ArrayBuffer,
  annotations: TextAnnotation[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();

  for (const note of annotations) {
    const page = pages[note.pageIndex];
    if (!page || !note.text.trim()) continue;
    const { width, height } = page.getSize();
    page.drawText(note.text, {
      x: note.xRatio * width,
      y: height - note.yRatio * height - note.fontSize,
      size: note.fontSize,
      font,
      color: rgb(note.color.r, note.color.g, note.color.b),
    });
  }

  return doc.save();
}
