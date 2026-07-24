import { createWorker } from "tesseract.js";
import { PDFDocument } from "pdf-lib";
import { loadPdfjs } from "@/lib/pdf/pdfjs";

export type OcrProgress = { page: number; totalPages: number; status: string; progress: number };

/**
 * Runs OCR on every page (rendered to canvas at 2x scale for accuracy) and
 * rebuilds a searchable PDF — the original page rendered as an image, with
 * an invisible, correctly-positioned text layer behind it. Uses tesseract.js's
 * own native PDF renderer for each page (the same one the `tesseract` CLI's
 * `pdf` output uses) rather than hand-placing word boxes, since getting text
 * positioning/rotation subtly wrong would be worse than not offering this at
 * all. Pages are then merged into one PDF via pdf-lib.
 *
 * Tesseract's recognition engine (~15MB: WASM core + English language data)
 * downloads from its default CDN on first use — the PDF itself never leaves
 * the browser, only this static, content-free engine asset is fetched.
 */
export async function ocrPdf(
  bytes: ArrayBuffer,
  onProgress?: (p: OcrProgress) => void
): Promise<Uint8Array> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const srcDoc = await loadingTask.promise;
  const totalPages = srcDoc.numPages;

  let currentPage = 0;
  const worker = await createWorker("eng", undefined, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress?.({ page: currentPage, totalPages, status: m.status, progress: m.progress });
      }
    },
  });

  try {
    const merged = await PDFDocument.create();

    for (let i = 1; i <= totalPages; i++) {
      currentPage = i;
      onProgress?.({ page: i, totalPages, status: "rendering page", progress: 0 });

      const page = await srcDoc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas isn't supported here.");
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;

      const { data } = await worker.recognize(canvas, {}, { pdf: true });
      if (!data.pdf) throw new Error("OCR didn't produce a result for this page.");

      const pageDoc = await PDFDocument.load(new Uint8Array(data.pdf));
      const [copiedPage] = await merged.copyPages(pageDoc, [0]);
      merged.addPage(copiedPage);
    }

    return await merged.save();
  } finally {
    await worker.terminate();
    await loadingTask.destroy();
  }
}
