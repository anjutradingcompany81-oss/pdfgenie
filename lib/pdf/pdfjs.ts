let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export async function renderPageToCanvas(
  file: ArrayBuffer,
  pageNumber: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: file.slice(0) });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get canvas context");

  await page.render({ canvas, canvasContext: context, viewport }).promise;
  await loadingTask.destroy();
  return canvas;
}

export async function getPageCount(file: ArrayBuffer): Promise<number> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: file.slice(0) });
  const doc = await loadingTask.promise;
  const count = doc.numPages;
  await loadingTask.destroy();
  return count;
}

export async function getPageSize(
  file: ArrayBuffer,
  pageNumber: number
): Promise<{ width: number; height: number }> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: file.slice(0) });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  await loadingTask.destroy();
  return { width: viewport.width, height: viewport.height };
}
