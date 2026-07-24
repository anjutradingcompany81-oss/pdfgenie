import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFNumber,
  PDFRawStream,
  PDFStream,
  decodePDFRawStream,
} from "pdf-lib";
import JSZip from "jszip";

export type ExtractImagesResult = {
  zipBlob: Blob | null;
  extractedCount: number;
  skippedCount: number;
};

function isSingleFilter(filter: unknown, name: string): boolean {
  return filter instanceof PDFName && filter.asString() === `/${name}`;
}

/** Only the color spaces we can convert to RGB with a well-defined, non-lossy formula. */
function colorComponents(dict: PDFDict): 1 | 3 | 4 | null {
  const cs = dict.lookup(PDFName.of("ColorSpace"));
  if (cs instanceof PDFName) {
    const name = cs.asString();
    if (name === "/DeviceGray" || name === "/CalGray") return 1;
    if (name === "/DeviceRGB" || name === "/CalRGB") return 3;
    if (name === "/DeviceCMYK") return 4;
  }
  return null;
}

function toRgba(
  raw: Uint8Array,
  width: number,
  height: number,
  components: 1 | 3 | 4
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++, p += components) {
    let r: number;
    let g: number;
    let b: number;
    if (components === 1) {
      r = g = b = raw[p];
    } else if (components === 3) {
      r = raw[p];
      g = raw[p + 1];
      b = raw[p + 2];
    } else {
      const c = raw[p] / 255;
      const m = raw[p + 1] / 255;
      const y = raw[p + 2] / 255;
      const k = raw[p + 3] / 255;
      r = 255 * (1 - c) * (1 - k);
      g = 255 * (1 - m) * (1 - k);
      b = 255 * (1 - y) * (1 - k);
    }
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = 255;
  }
  return out;
}

function rgbaToPngBlob(width: number, height: number, rgba: Uint8ClampedArray<ArrayBuffer>): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported here.");
  ctx.putImageData(new ImageData(rgba, width, height), 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed."))), "image/png");
  });
}

/**
 * Walks each page's /Resources /XObject dictionary directly (pdf-lib's
 * low-level object API) rather than rendering the page, so extracted images
 * are the original embedded data, not a canvas-composited (masked/blended)
 * approximation of it.
 *
 * Scope is deliberately narrow: JPEG images (DCTDecode) are passed through
 * as-is, and Flate-compressed 8-bit DeviceGray/RGB/CMYK images are decoded
 * and re-encoded as PNG. Indexed color, 1-bit images, JPEG2000, CCITT fax
 * scans, and images nested inside Form XObjects aren't supported — those
 * are skipped rather than risking incorrect output, and the caller gets an
 * honest count of what was skipped.
 */
export async function extractImages(bytes: ArrayBuffer): Promise<ExtractImagesResult> {
  const pdfDoc = await PDFDocument.load(bytes);
  const zip = new JSZip();
  let extractedCount = 0;
  let skippedCount = 0;

  const pages = pdfDoc.getPages();
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const resources = pages[pageIndex].node.Resources();
    if (!resources) continue;
    const xObjects = resources.lookupMaybe(PDFName.of("XObject"), PDFDict);
    if (!xObjects) continue;

    let imageIndex = 0;
    for (const name of xObjects.keys()) {
      let stream: unknown;
      try {
        stream = xObjects.lookup(name, PDFStream);
      } catch {
        continue;
      }
      if (!(stream instanceof PDFRawStream)) continue;

      const subtype = stream.dict.lookup(PDFName.of("Subtype"));
      if (!(subtype instanceof PDFName) || subtype.asString() !== "/Image") continue;

      const widthObj = stream.dict.lookup(PDFName.of("Width"));
      const heightObj = stream.dict.lookup(PDFName.of("Height"));
      const width = widthObj instanceof PDFNumber ? widthObj.asNumber() : null;
      const height = heightObj instanceof PDFNumber ? heightObj.asNumber() : null;
      if (!width || !height) {
        skippedCount++;
        continue;
      }

      try {
        const filter = stream.dict.lookup(PDFName.of("Filter"));

        if (isSingleFilter(filter, "DCTDecode")) {
          zip.file(`page${pageIndex + 1}-image${++imageIndex}.jpg`, stream.contents);
          extractedCount++;
          continue;
        }

        const bpcObj = stream.dict.lookup(PDFName.of("BitsPerComponent"));
        const bitsPerComponent = bpcObj instanceof PDFNumber ? bpcObj.asNumber() : null;
        const components = colorComponents(stream.dict);
        if (bitsPerComponent !== 8 || !components) {
          skippedCount++;
          continue;
        }

        const decoded = decodePDFRawStream(stream).decode();
        if (decoded.length < width * height * components) {
          skippedCount++;
          continue;
        }

        const rgba = toRgba(decoded, width, height, components);
        const blob = await rgbaToPngBlob(width, height, rgba);
        zip.file(`page${pageIndex + 1}-image${++imageIndex}.png`, blob);
        extractedCount++;
      } catch {
        skippedCount++;
      }
    }
  }

  if (extractedCount === 0) {
    return { zipBlob: null, extractedCount: 0, skippedCount };
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return { zipBlob, extractedCount, skippedCount };
}
