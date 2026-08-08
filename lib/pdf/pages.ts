import { PDFDocument, degrees } from "pdf-lib";

/**
 * Structural page operations (rotate, insert, duplicate, delete) for the
 * Edit PDF tool's Pages menu — separate from lib/pdf/edit.ts, which only
 * ever adds overlay objects on top of a page, never changes how many pages
 * exist or their order.
 *
 * These necessarily operate on the ORIGINAL bytes, not on top of any
 * in-progress overlay edits: an overlay edit's position is anchored to a
 * specific page index and, for a run-replacement edit, to that page's own
 * geometry, so shifting pages around after edits have been placed has no
 * sound way to carry them along automatically. The caller (EditPdfClient)
 * is responsible for clearing the in-progress edit session — with the
 * person's confirmation — before calling any of these.
 */

export async function rotatePage(bytes: ArrayBuffer, pageIndex: number): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const page = doc.getPage(pageIndex);
  const current = page.getRotation().angle;
  page.setRotation(degrees((current + 90) % 360));
  return doc.save();
}

export async function insertBlankPage(bytes: ArrayBuffer, afterPageIndex: number): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const reference = doc.getPage(Math.min(afterPageIndex, doc.getPageCount() - 1));
  const { width, height } = reference.getSize();
  doc.insertPage(afterPageIndex + 1, [width, height]);
  return doc.save();
}

export async function duplicatePage(bytes: ArrayBuffer, pageIndex: number): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const [copied] = await doc.copyPages(doc, [pageIndex]);
  doc.insertPage(pageIndex + 1, copied);
  return doc.save();
}

export async function deletePage(bytes: ArrayBuffer, pageIndex: number): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  if (doc.getPageCount() <= 1) {
    throw new Error("Can't delete the only page in a document.");
  }
  doc.removePage(pageIndex);
  return doc.save();
}
