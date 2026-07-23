import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type InsertPosition = "start" | "end" | { after: number };

export async function insertPages(
  baseBytes: ArrayBuffer,
  insertBytes: ArrayBuffer,
  position: InsertPosition
): Promise<Uint8Array> {
  const base = await PDFDocument.load(baseBytes);
  const insertDoc = await PDFDocument.load(insertBytes);
  const insertedPages = await base.copyPages(insertDoc, insertDoc.getPageIndices());

  if (position === "start") {
    [...insertedPages].reverse().forEach((page) => base.insertPage(0, page));
  } else if (position === "end") {
    insertedPages.forEach((page) => base.addPage(page));
  } else {
    const insertAt = position.after + 1;
    [...insertedPages].reverse().forEach((page) => base.insertPage(insertAt, page));
  }

  return base.save();
}

export async function removePages(
  bytes: ArrayBuffer,
  pageIndices: number[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const toRemove = [...pageIndices].sort((a, b) => b - a);
  for (const index of toRemove) {
    doc.removePage(index);
  }
  return doc.save();
}

export async function resizePdf(
  bytes: ArrayBuffer,
  targetWidth: number,
  targetHeight: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    page.scaleContent(targetWidth / width, targetHeight / height);
    page.setSize(targetWidth, targetHeight);
  }
  return doc.save();
}

export async function addTextToPdf(
  bytes: ArrayBuffer,
  pageIndex: number,
  text: string,
  xPt: number,
  yPt: number,
  fontSize: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(pageIndex);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(text, {
    x: xPt,
    y: yPt,
    size: fontSize,
    font,
    color: rgb(0.09, 0.075, 0.06),
  });
  return doc.save();
}
