import { PDFDocument } from "pdf-lib";

export type SignaturePlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function embedSignature(
  bytes: ArrayBuffer,
  pageIndex: number,
  signaturePng: Uint8Array,
  placement: SignaturePlacement
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(pageIndex);
  const image = await doc.embedPng(signaturePng);
  page.drawImage(image, placement);
  return doc.save();
}
