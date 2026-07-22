import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export async function extractPages(
  bytes: ArrayBuffer,
  pageIndices: number[]
): Promise<Uint8Array> {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, pageIndices);
  pages.forEach((page) => out.addPage(page));
  return out.save();
}

export async function splitEveryPage(
  bytes: ArrayBuffer,
  baseName: string
): Promise<Blob> {
  const src = await PDFDocument.load(bytes);
  const zip = new JSZip();
  const pageCount = src.getPageCount();
  const digits = String(pageCount).length;

  for (let i = 0; i < pageCount; i++) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(src, [i]);
    out.addPage(page);
    const pageBytes = await out.save();
    const num = String(i + 1).padStart(digits, "0");
    zip.file(`${baseName}-page-${num}.pdf`, pageBytes);
  }

  return zip.generateAsync({ type: "blob" });
}

export function parsePageRanges(input: string, pageCount: number): Set<number> {
  const result = new Set<number>();
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Math.max(1, parseInt(rangeMatch[1], 10));
      const end = Math.min(pageCount, parseInt(rangeMatch[2], 10));
      for (let i = start; i <= end; i++) result.add(i - 1);
      continue;
    }
    const single = parseInt(part, 10);
    if (!Number.isNaN(single) && single >= 1 && single <= pageCount) {
      result.add(single - 1);
    }
  }

  return result;
}
