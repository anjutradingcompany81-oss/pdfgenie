import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

export async function addWatermark(
  bytes: ArrayBuffer,
  text: string,
  opacity: number = 0.25
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontSize = 48;
  const textWidth = font.widthOfTextAtSize(text, fontSize);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.4, 0.4, 0.4),
      opacity,
      rotate: degrees(-45),
    });
  }

  return doc.save();
}
