import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { loadPdfjs } from "@/lib/pdf/pdfjs";

export async function pdfToImages(
  bytes: ArrayBuffer,
  format: "png" | "jpeg",
  baseName: string,
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const doc = await loadingTask.promise;
  const zip = new JSZip();
  const pageCount = doc.numPages;
  const digits = String(pageCount).length;
  const mime = format === "png" ? "image/png" : "image/jpeg";
  const ext = format === "png" ? "png" : "jpg";

  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mime, format === "jpeg" ? 0.9 : undefined)
    );
    if (blob) {
      const num = String(i).padStart(digits, "0");
      zip.file(`${baseName}-page-${num}.${ext}`, blob);
    }

    onProgress?.(i, pageCount);
  }

  await loadingTask.destroy();
  return zip.generateAsync({ type: "blob" });
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  return doc.save();
}
