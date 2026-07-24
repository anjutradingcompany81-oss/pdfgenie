import { PDFDocument, degrees } from "pdf-lib";

export type OrganizedPage = {
  /** Index into the ORIGINAL document. */
  originalIndex: number;
  /** Additional rotation to apply, added to the page's existing rotation. */
  rotation: 0 | 90 | 180 | 270;
};

/**
 * Rebuilds a PDF from a possibly-reordered, possibly-rotated, possibly
 * shorter (deleted pages just aren't included) list of the original pages.
 */
export async function reorganizePdf(bytes: ArrayBuffer, pages: OrganizedPage[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();

  const copied = await out.copyPages(
    src,
    pages.map((p) => p.originalIndex)
  );

  copied.forEach((page, i) => {
    const rotation = pages[i].rotation;
    if (rotation) {
      page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
    }
    out.addPage(page);
  });

  return out.save();
}
