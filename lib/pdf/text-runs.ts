import { loadPdfjs } from "@/lib/pdf/pdfjs";
import type { FontFamily } from "@/lib/pdf/edit";

export type TextRun = {
  id: string;
  pageIndex: number;
  text: string;
  /** Ratio (0-1) of page width/height, top-left origin — matches every other object in lib/pdf/edit.ts. */
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
  /** Distance in PDF points from the box's top (yRatio) down to the text baseline — lets edit.ts redraw the replacement text at the same visual baseline without re-deriving ascent assumptions. */
  baselineOffsetPt: number;
  fontSizePt: number;
  fontFamily: FontFamily;
  bold: boolean;
  italic: boolean;
};

// A glyph typically extends this fraction of its font size above the
// baseline (ascent) — no font-metrics table is available here, just a
// reasonable constant that works for common fonts.
const ASCENT_RATIO = 0.82;
// Box height as a multiple of font size, giving a little breathing room
// above the ascent and below the descent.
const LINE_HEIGHT_RATIO = 1.25;
// Two items on the same page are treated as the same line if their
// baselines are within this many PDF points of each other.
const LINE_BASELINE_TOLERANCE_PT = 2;

function guessFontFamily(name: string): { fontFamily: FontFamily; bold: boolean; italic: boolean } {
  const n = name.toLowerCase();
  const bold = n.includes("bold") || n.includes("black") || n.includes("heavy") || n.includes("semibold");
  const italic = n.includes("italic") || n.includes("oblique");
  if (n.includes("times") || n.includes("serif") || n.includes("georgia") || n.includes("cambria") || n.includes("garamond") || n.includes("minion")) {
    return { fontFamily: "TimesRoman", bold, italic };
  }
  if (n.includes("courier") || n.includes("mono") || n.includes("consolas") || n.includes("menlo")) {
    return { fontFamily: "Courier", bold, italic };
  }
  return { fontFamily: "Helvetica", bold, italic };
}

type PositionedItem = {
  str: string;
  x: number;
  yBaseline: number;
  width: number;
  fontHeight: number;
  fontName: string;
};

/**
 * Detects individual lines of existing text on a page, in the same
 * top-left-origin point space every other object in lib/pdf/edit.ts uses,
 * so a detected run's bbox can be handed straight to a TextEditObject
 * without any extra coordinate conversion.
 *
 * This is a heuristic, not a real layout parse: font matching only looks at
 * the font's internal name for a handful of common keywords (falling back
 * to Helvetica), color isn't detected here at all (sampled from the
 * rendered canvas by the caller instead — see EditPdfClient's
 * sampleRunColors), and rotated/skewed text isn't specially handled.
 */
export async function extractTextRuns(bytes: ArrayBuffer, pageIndex: number): Promise<TextRun[]> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: bytes.slice(0) });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  const positioned: PositionedItem[] = [];
  for (const raw of textContent.items) {
    if (!("transform" in raw) || !raw.str || !raw.str.trim()) continue;
    const t = pdfjs.Util.transform(viewport.transform, raw.transform) as number[];
    const fontHeight = Math.hypot(t[2], t[3]) || Math.hypot(t[0], t[1]) || 10;
    positioned.push({
      str: raw.str,
      x: t[4],
      yBaseline: t[5],
      width: raw.width || 0,
      fontHeight,
      fontName: raw.fontName ?? "",
    });
  }
  positioned.sort((a, b) => a.yBaseline - b.yBaseline || a.x - b.x);

  const lines: PositionedItem[][] = [];
  for (const item of positioned) {
    const line = lines.find((l) => Math.abs(l[0].yBaseline - item.yBaseline) < LINE_BASELINE_TOLERANCE_PT);
    if (line) line.push(item);
    else lines.push([item]);
  }

  const runs: TextRun[] = [];
  for (const line of lines) {
    line.sort((a, b) => a.x - b.x);
    let text = "";
    for (const item of line) {
      text = text ? `${text}${text.endsWith(" ") || item.str.startsWith(" ") ? "" : " "}${item.str}` : item.str;
    }
    if (!text.trim()) continue;

    const left = Math.min(...line.map((i) => i.x));
    const right = Math.max(...line.map((i) => i.x + i.width));
    const baseline = line[0].yBaseline;
    const fontHeight = line[0].fontHeight;
    const top = baseline - fontHeight * ASCENT_RATIO;
    const height = fontHeight * LINE_HEIGHT_RATIO;
    const { fontFamily, bold, italic } = guessFontFamily(line[0].fontName);

    runs.push({
      id: `run-${pageIndex}-${runs.length}`,
      pageIndex,
      text,
      xRatio: left / viewport.width,
      yRatio: top / viewport.height,
      wRatio: (right - left) / viewport.width,
      hRatio: height / viewport.height,
      baselineOffsetPt: baseline - top,
      fontSizePt: fontHeight,
      fontFamily,
      bold,
      italic,
    });
  }

  await loadingTask.destroy();
  return runs;
}
