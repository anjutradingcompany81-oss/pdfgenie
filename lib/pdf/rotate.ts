import { PDFDocument, degrees } from "pdf-lib";

export async function rotatePdf(bytes: ArrayBuffer, rotationDegrees: 90 | 180 | 270): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  for (const page of doc.getPages()) {
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + rotationDegrees) % 360));
  }
  return doc.save();
}
