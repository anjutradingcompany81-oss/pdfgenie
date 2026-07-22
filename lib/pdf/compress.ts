import { PDFDocument } from "pdf-lib";
import { loadPdfjs } from "@/lib/pdf/pdfjs";

export async function lightCompress(bytes: ArrayBuffer): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  return doc.save({ useObjectStreams: true, addDefaultPage: false });
}

export async function strongCompress(
  bytes: ArrayBuffer,
  onProgress?: (done: number, total: number) => void,
  quality = 0.55,
  scale = 1.4
): Promise<Uint8Array> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const srcDoc = await loadingTask.promise;
  const out = await PDFDocument.create();
  const pageCount = srcDoc.numPages;

  for (let i = 1; i <= pageCount; i++) {
    const page = await srcDoc.getPage(i);
    const pointViewport = page.getViewport({ scale: 1 });
    const renderViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    await page.render({ canvas, canvasContext: ctx, viewport: renderViewport }).promise;

    const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
    const jpegBytes = dataUrlToBytes(jpegDataUrl);
    const jpegImage = await out.embedJpg(jpegBytes);

    const outPage = out.addPage([pointViewport.width, pointViewport.height]);
    outPage.drawImage(jpegImage, {
      x: 0,
      y: 0,
      width: pointViewport.width,
      height: pointViewport.height,
    });

    onProgress?.(i, pageCount);
  }

  await loadingTask.destroy();
  return out.save();
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
