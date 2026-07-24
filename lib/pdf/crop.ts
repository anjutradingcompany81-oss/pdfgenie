import { PDFDocument } from "pdf-lib";

/** Ratio coordinates (0-1), top-left origin — matches the on-screen preview. */
export type CropBox = { x: number; y: number; w: number; h: number };

export async function cropPdf(bytes: ArrayBuffer, box: CropBox): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const cropX = box.x * width;
    const cropWidth = box.w * width;
    const cropHeight = box.h * height;
    // PDF's y-axis runs bottom-up; the preview's box.y is measured from the top.
    const cropY = height - box.y * height - cropHeight;
    page.setCropBox(cropX, cropY, cropWidth, cropHeight);
  }

  return doc.save();
}
