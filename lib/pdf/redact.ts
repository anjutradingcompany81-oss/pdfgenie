import { PDFDocument, rgb } from "pdf-lib";

/** Ratio coordinates (0-1), top-left origin — matches the on-screen preview. */
export type RedactBox = { x: number; y: number; w: number; h: number };

/** Covers the same relative area on every page with a solid white rectangle — for masking a watermark that repeats in the same position across pages. */
export async function coverArea(bytes: ArrayBuffer, box: RedactBox): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const boxWidth = box.w * width;
    const boxHeight = box.h * height;
    const x = box.x * width;
    const y = height - box.y * height - boxHeight;
    page.drawRectangle({ x, y, width: boxWidth, height: boxHeight, color: rgb(1, 1, 1) });
  }

  return doc.save();
}
