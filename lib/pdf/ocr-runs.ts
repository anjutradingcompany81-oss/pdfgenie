import { createWorker } from "tesseract.js";
import { loadPdfjs } from "@/lib/pdf/pdfjs";
import { guessFontFamily, ASCENT_RATIO, LINE_HEIGHT_RATIO, type TextRun } from "@/lib/pdf/text-runs";

export type OcrLanguage = "eng" | "hin";

// Architected as a list specifically so adding a third language later is a
// one-line change here, not a hunt through the editor for hardcoded strings.
export const OCR_LANGUAGES: { code: OcrLanguage; label: string }[] = [
  { code: "eng", label: "English" },
  { code: "hin", label: "Hindi" },
];

const IMAGE_OP_NAMES = [
  "paintImageXObject",
  "paintImageXObjectRepeat",
  "paintImageMaskXObject",
  "paintImageMaskXObjectGroup",
  "paintImageMaskXObjectRepeat",
  "paintJpegXObject",
  "paintInlineImageXObject",
] as const;

/**
 * True when a page has no extractable text layer AND actually contains an
 * image — i.e. it looks like a scan, not just a blank page. A genuinely
 * blank page (no text, no image) has nothing for OCR to find either, so it
 * isn't worth prompting the user to run it.
 */
export async function pageLooksScanned(bytes: ArrayBuffer, pageIndex: number): Promise<boolean> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  try {
    const doc = await loadingTask.promise;
    const page = await doc.getPage(pageIndex + 1);

    const textContent = await page.getTextContent();
    const hasText = textContent.items.some((item) => "str" in item && item.str.trim().length > 0);
    if (hasText) return false;

    const opList = await page.getOperatorList();
    const imageOpCodes = new Set(IMAGE_OP_NAMES.map((name) => pdfjs.OPS[name as keyof typeof pdfjs.OPS]).filter((v) => v !== undefined));
    const hasImage = opList.fnArray.some((op) => imageOpCodes.has(op));
    return hasImage;
  } finally {
    await loadingTask.destroy();
  }
}

export type OcrRunProgress = { status: string; progress: number };

// Generous on purpose — the engine + language data (several MB) downloads
// from a CDN on first use, and slow connections shouldn't be cut off
// early; this exists to bound a hang, not to police normal load time.
const OCR_ENGINE_LOAD_TIMEOUT_MS = 45_000;

/**
 * Renders a page to canvas and runs OCR on it, returning one TextRun per
 * recognized line — the same shape produced by extractTextRuns.ts for a
 * real text layer, so every downstream piece (the click-to-edit hitboxes,
 * commitTextEditor, applyPdfEdits) handles an OCR-recognized line exactly
 * like a PDF-native one, with no separate code path to keep in sync.
 *
 * The scanned page image itself is never touched or replaced — recognized
 * lines are laid on top of it using the editor's existing cover-and-redraw
 * text-edit mechanism, same as editing real PDF text.
 */
export async function runOcrOnPage(
  bytes: ArrayBuffer,
  pageIndex: number,
  lang: OcrLanguage,
  onProgress?: (p: OcrRunProgress) => void
): Promise<TextRun[]> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageIndex + 1);

  // 2x scale for recognition accuracy — small glyphs at 1x (screen-preview
  // resolution) hurt Tesseract's accuracy noticeably on typical scan DPIs.
  const scale = 2;
  const viewport = page.getViewport({ scale });
  const pageHeightPt = page.getViewport({ scale: 1 }).height;

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas isn't supported here.");
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  onProgress?.({ status: "loading recognition engine", progress: 0 });
  // createWorker fetches its engine and language data from a CDN on first
  // use, and a network failure there can leave the underlying promise
  // neither resolving nor rejecting — observed directly against this engine
  // rather than assumed. Racing it against a timeout is what turns that into
  // a clear, catchable failure instead of a permanently stuck progress bar.
  const worker = await Promise.race([
    createWorker(lang, undefined, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          onProgress?.({ status: m.status, progress: m.progress });
        }
      },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timed out loading the OCR engine — check your connection and try again.")), OCR_ENGINE_LOAD_TIMEOUT_MS)
    ),
  ]);

  try {
    const { data } = await worker.recognize(canvas, {}, { blocks: true });
    const runs: TextRun[] = [];

    for (const block of data.blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          const text = line.text.trim();
          if (!text) continue;

          const xRatio = line.bbox.x0 / canvas.width;
          const yRatio = line.bbox.y0 / canvas.height;
          const wRatio = (line.bbox.x1 - line.bbox.x0) / canvas.width;
          const hRatio = (line.bbox.y1 - line.bbox.y0) / canvas.height;
          const boxHeightPt = hRatio * pageHeightPt;
          const fontSizePt = Math.max(4, boxHeightPt / LINE_HEIGHT_RATIO);

          // Tesseract reports the line's own baseline — more accurate than
          // the ascent-ratio approximation extractTextRuns.ts has to fall
          // back to, since it has no baseline of its own to read.
          const baselineY = (line.baseline.y0 + line.baseline.y1) / 2;
          const baselineWithinBox = baselineY > line.bbox.y0 && baselineY <= line.bbox.y1;
          const baselineOffsetPt = baselineWithinBox
            ? ((baselineY - line.bbox.y0) / canvas.height) * pageHeightPt
            : fontSizePt * ASCENT_RATIO;

          const dominantFontName = line.words.find((w) => w.font_name)?.font_name ?? "";
          const { fontFamily, bold, italic } = guessFontFamily(dominantFontName);

          runs.push({
            id: `ocr-${pageIndex}-${runs.length}-${Date.now()}`,
            pageIndex,
            text,
            xRatio,
            yRatio,
            wRatio,
            hRatio,
            baselineOffsetPt,
            fontSizePt,
            fontFamily,
            bold,
            italic,
            source: "ocr",
            confidence: line.confidence,
          });
        }
      }
    }

    return runs;
  } finally {
    await worker.terminate();
    await loadingTask.destroy();
  }
}
