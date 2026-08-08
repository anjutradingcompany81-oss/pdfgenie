"use client";

import {
  FileEdit,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Highlighter,
  Eraser,
  Ban,
  ImageIcon,
  Pencil,
  Undo2,
  Redo2,
  Trash2,
  Bold,
  Italic,
  Edit3,
  ScanText,
  AlertTriangle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { EditPageThumbRail } from "@/components/tools/EditPageThumbRail";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageCount, getPageSize, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { extractTextRuns, type TextRun } from "@/lib/pdf/text-runs";
import { pageLooksScanned, runOcrOnPage, OCR_LANGUAGES, type OcrLanguage } from "@/lib/pdf/ocr-runs";
import { publishToolProgress } from "@/lib/tools/tool-output";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";
import {
  applyPdfEdits,
  isBoxShape,
  isLineShape,
  FONT_FAMILY_LABELS,
  type EditObject,
  type TextObject,
  type TextEditObject,
  type ShapeObject,
  type ImageObject,
  type DrawObject,
  type BoxShapeKind,
  type LineShapeKind,
  type FontFamily,
  type RGB,
} from "@/lib/pdf/edit";

const PREVIEW_WIDTH = 640;

type ToolId = "select" | "text" | "editText" | "rectangle" | "ellipse" | "line" | "arrow" | "highlight" | "cover" | "redact" | "image" | "draw";

const TOOLS: { id: ToolId; label: string; icon: typeof MousePointer2 }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "text", label: "Text", icon: Type },
  { id: "editText", label: "Edit Text", icon: Edit3 },
  { id: "rectangle", label: "Rectangle", icon: Square },
  { id: "ellipse", label: "Ellipse", icon: Circle },
  { id: "line", label: "Line", icon: Minus },
  { id: "arrow", label: "Arrow", icon: ArrowUpRight },
  { id: "highlight", label: "Highlight", icon: Highlighter },
  { id: "cover", label: "Cover", icon: Eraser },
  { id: "redact", label: "Redact", icon: Ban },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "draw", label: "Draw", icon: Pencil },
];

const FONT_FAMILIES: FontFamily[] = ["Helvetica", "TimesRoman", "Courier"];
const FONT_STACKS: Record<FontFamily, string> = {
  Helvetica: "Helvetica, Arial, sans-serif",
  TimesRoman: "'Times New Roman', Times, serif",
  Courier: "'Courier New', Courier, monospace",
};

const BLACK: RGB = { r: 0.09, g: 0.075, b: 0.06 };
const BLUE: RGB = { r: 0.1, g: 0.3, b: 0.85 };
const YELLOW: RGB = { r: 1, g: 0.92, b: 0.25 };
const WHITE: RGB = { r: 1, g: 1, b: 1 };
// Pure black, not the warm-tinted BLACK above — the universal redaction convention.
const REDACT_BLACK: RGB = { r: 0, g: 0, b: 0 };

type Style = {
  fontFamily: FontFamily;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  textColor: RGB;
  strokeColor: RGB;
  strokeWidth: number;
  fillEnabled: boolean;
  fillColor: RGB;
  opacity: number;
};

const DEFAULT_STYLE: Style = {
  fontFamily: "Helvetica",
  fontSize: 16,
  bold: false,
  italic: false,
  textColor: BLACK,
  strokeColor: BLUE,
  strokeWidth: 2,
  fillEnabled: false,
  fillColor: BLUE,
  opacity: 1,
};

function rgbToHex(c: RGB): string {
  const toHex = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}

function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

function cssColor(c: RGB, alpha = 1): string {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Approximates a text run's background and ink color by histogramming
 * pixels from the already-rendered preview canvas — no content-stream color
 * parsing needed. The most common (quantized) color is taken as the
 * background; among colors meaningfully different from it, the one that's
 * darkest relative to the background is taken as the text color. Works well
 * for the common case (solid-color text on a plain background); unusual
 * cases (gradients, busy backgrounds) just fall back to black-on-white.
 */
function sampleRunColors(
  canvas: HTMLCanvasElement,
  run: { xRatio: number; yRatio: number; wRatio: number; hRatio: number }
): { background: RGB; text: RGB } {
  const fallback = { background: WHITE, text: BLACK };
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallback;

  const x = Math.max(0, Math.round(run.xRatio * canvas.width));
  const y = Math.max(0, Math.round(run.yRatio * canvas.height));
  const w = Math.max(1, Math.min(canvas.width - x, Math.round(run.wRatio * canvas.width)));
  const h = Math.max(1, Math.min(canvas.height - y, Math.round(run.hRatio * canvas.height)));
  if (w <= 0 || h <= 0) return fallback;

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(x, y, w, h).data;
  } catch {
    return fallback; // e.g. a tainted canvas — shouldn't happen for a same-origin render, but don't crash the editor over a color guess
  }

  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    // Quantize to reduce anti-aliasing noise so near-identical shades bucket together.
    const r = Math.round(data[i] / 16) * 16;
    const g = Math.round(data[i + 1] / 16) * 16;
    const b = Math.round(data[i + 2] / 16) * 16;
    const key = `${r},${g},${b}`;
    const entry = buckets.get(key);
    if (entry) entry.count += 1;
    else buckets.set(key, { count: 1, r, g, b });
  }

  const entries = [...buckets.values()].sort((a, b) => b.count - a.count);
  if (entries.length === 0) return fallback;

  const bg = entries[0];
  const background: RGB = { r: bg.r / 255, g: bg.g / 255, b: bg.b / 255 };
  const bgLuminance = 0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b;

  let text: RGB = BLACK;
  let bestScore = -Infinity;
  for (const e of entries) {
    const distFromBg = Math.hypot(e.r - bg.r, e.g - bg.g, e.b - bg.b);
    if (distFromBg < 40) continue; // too close to background to be ink
    const luminance = 0.299 * e.r + 0.587 * e.g + 0.114 * e.b;
    const score = bgLuminance - luminance + distFromBg * 0.1; // prefer darker-than-background ink, the common case
    if (score > bestScore) {
      bestScore = score;
      text = { r: e.r / 255, g: e.g / 255, b: e.b / 255 };
    }
  }
  return { background, text };
}

const BOX_DEFAULT_KINDS = new Set<BoxShapeKind>(["rectangle", "ellipse", "highlight", "cover", "redact"]);
const LINE_KINDS = new Set<LineShapeKind>(["line", "arrow"]);

type DragState =
  | { mode: "move-object"; id: string; grabDx: number; grabDy: number }
  | { mode: "resize-box"; id: string }
  | { mode: "resize-line"; id: string; endpoint: "x1y1" | "x2y2" }
  | { mode: "draw"; id: string }
  | null;

type TextEditorState = {
  id: string | null;
  pageIndex: number;
  xRatio: number;
  yRatio: number;
  text: string;
  /** Present only when editing/replacing a run of text that already existed in the PDF (as opposed to a brand-new text box). */
  runEdit?: {
    wRatio: number;
    hRatio: number;
    baselineOffsetPt: number;
    fontSizePt: number;
    fontFamily: FontFamily;
    bold: boolean;
    italic: boolean;
    backgroundColor: RGB;
    color: RGB;
  };
};

export default function EditPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSizePt, setPageSizePt] = useState({ width: 0, height: 0 });
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);

  const [objects, setObjectsState] = useState<EditObject[]>([]);
  const objectsRef = useRef<EditObject[]>([]);
  const [history, setHistory] = useState<EditObject[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [activeTool, setActiveTool] = useState<ToolId>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textEditor, setTextEditor] = useState<TextEditorState | null>(null);
  const [style, setStyle] = useState<Style>(DEFAULT_STYLE);
  const [textRuns, setTextRuns] = useState<TextRun[]>([]);

  // Scanned-page OCR: `scannedPage` is re-derived per page (null while
  // checking); `ocrRunsByPage` accumulates recognized lines separately from
  // `textRuns` because that state is wholesale replaced every time the page
  // changes (see the extractTextRuns effect below) — folding OCR results
  // into it directly would lose them the moment the user flipped away and
  // back to the page they just ran OCR on.
  const [scannedPages, setScannedPages] = useState<Record<number, boolean>>({});
  const [ocrLang, setOcrLang] = useState<OcrLanguage>("eng");
  const [ocrRunsByPage, setOcrRunsByPage] = useState<Record<number, TextRun[]>>({});
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrProgressPct, setOcrProgressPct] = useState(0);

  const canvasHost = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewScale = pageSizePt.width ? PREVIEW_WIDTH / pageSizePt.width : 1;
  const previewHeight = pageSizePt.height * previewScale;

  function setLive(next: EditObject[]) {
    objectsRef.current = next;
    setObjectsState(next);
  }

  function commit(next: EditObject[]) {
    objectsRef.current = next;
    setObjectsState(next);
    setHistory((h) => [...h.slice(0, historyIndex + 1), next]);
    setHistoryIndex((i) => i + 1);
  }

  function undo() {
    setHistoryIndex((idx) => {
      if (idx === 0) return idx;
      const nextIdx = idx - 1;
      objectsRef.current = history[nextIdx];
      setObjectsState(history[nextIdx]);
      return nextIdx;
    });
    setSelectedId(null);
  }

  function redo() {
    setHistoryIndex((idx) => {
      if (idx >= history.length - 1) return idx;
      const nextIdx = idx + 1;
      objectsRef.current = history[nextIdx];
      setObjectsState(history[nextIdx]);
      return nextIdx;
    });
    setSelectedId(null);
  }

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    try {
      const buf = await f.arrayBuffer();
      const count = await getPageCount(buf);
      setFile(f);
      setBuffer(buf);
      setPageCount(count);
      setPageIndex(0);
      setLive([]);
      setHistory([[]]);
      setHistoryIndex(0);
      setSelectedId(null);
      setTextEditor(null);
      setActiveTool("select");
      setOcrRunsByPage({});
      setScannedPages({});
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setPageCount(0);
    setPageIndex(0);
    setLive([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedId(null);
    setTextEditor(null);
    setError(null);
    setOcrRunsByPage({});
    setScannedPages({});
  }

  useEffect(() => {
    if (!buffer) return;
    let cancelled = false;
    getPageSize(buffer, pageIndex + 1).then((size) => {
      if (!cancelled) setPageSizePt(size);
    });
    return () => {
      cancelled = true;
    };
  }, [buffer, pageIndex]);

  useEffect(() => {
    if (!buffer || !pageSizePt.width || !canvasHost.current) return;
    let cancelled = false;
    const scale = PREVIEW_WIDTH / pageSizePt.width;
    renderPageToCanvas(buffer, pageIndex + 1, scale)
      .then((canvas) => {
        if (cancelled || !canvasHost.current) return;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvasHost.current.replaceChildren(canvas);
        pageCanvasRef.current = canvas;
      })
      .catch(() => {
        // The background page image is a visual aid only — editing still works
        // via ratio-based positioning even if this particular render fails.
      });
    return () => {
      cancelled = true;
    };
  }, [buffer, pageIndex, pageSizePt.width]);

  // Detect existing text runs whenever the page changes — cheap enough (pure
  // text-content parsing, no rendering) to always keep ready, not just when
  // the Edit Text tool is active, so double-clicking a placed edit to
  // re-open it works regardless of which tool is currently selected.
  useEffect(() => {
    if (!buffer) return;
    let cancelled = false;
    extractTextRuns(buffer, pageIndex)
      .then((runs) => {
        if (!cancelled) setTextRuns(runs);
      })
      .catch(() => {
        // No detected runs just means the Edit Text tool has nothing to offer on this page — not fatal.
      });
    return () => {
      cancelled = true;
    };
  }, [buffer, pageIndex]);

  // Detects whether the current page is a scan (an image with no text
  // layer) so the "Run OCR" prompt only appears where it's actually needed
  // — not on a page whose text just hasn't loaded yet, and not on a
  // genuinely blank page with nothing for OCR to find either.
  useEffect(() => {
    if (!buffer) return;
    let cancelled = false;
    pageLooksScanned(buffer, pageIndex)
      .then((scanned) => {
        if (!cancelled) setScannedPages((prev) => ({ ...prev, [pageIndex]: scanned }));
      })
      .catch(() => {
        if (!cancelled) setScannedPages((prev) => ({ ...prev, [pageIndex]: false }));
      });
    return () => {
      cancelled = true;
    };
  }, [buffer, pageIndex]);

  async function handleRunOcr() {
    if (!buffer || ocrBusy) return;
    setOcrBusy(true);
    setOcrProgressPct(0);
    setError(null);
    publishToolProgress({ active: true, label: "Loading OCR engine…", percent: 0 });
    try {
      const runs = await runOcrOnPage(buffer, pageIndex, ocrLang, (p) => {
        const pct = p.status === "recognizing text" ? Math.round(p.progress * 100) : 0;
        setOcrProgressPct(pct);
        publishToolProgress({
          active: true,
          label: p.status === "recognizing text" ? "Recognizing text…" : "Loading OCR engine…",
          percent: pct,
        });
      });
      setOcrRunsByPage((prev) => ({ ...prev, [pageIndex]: runs }));
      setActiveTool("editText");
      if (runs.length === 0) {
        setError("OCR didn't find any recognizable text on this page.");
      }
    } catch {
      setError("OCR couldn't process this page — try a clearer scan or a different language.");
    } finally {
      setOcrBusy(false);
      publishToolProgress({ active: false });
    }
  }

  function ratioFromEvent(e: { clientX: number; clientY: number }) {
    const rect = previewRef.current!.getBoundingClientRect();
    return {
      xRatio: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      yRatio: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }

  const selected = objects.find((o) => o.id === selectedId) ?? null;

  // --- Text placement / editing -------------------------------------------------

  function startNewText(xRatio: number, yRatio: number) {
    setTextEditor({ id: null, pageIndex, xRatio, yRatio, text: "" });
    setSelectedId(null);
  }

  function startEditingText(obj: TextObject) {
    setTextEditor({ id: obj.id, pageIndex: obj.pageIndex, xRatio: obj.xRatio, yRatio: obj.yRatio, text: obj.text });
    setSelectedId(obj.id);
  }

  /** Opens the inline editor for a detected (or already-edited) run of existing text. Re-clicking a run that's already been edited seeds the editor with its current replacement text, not the stale original. */
  function startEditingRun(run: TextRun) {
    const existing = objectsRef.current.find((o) => o.id === run.id && o.type === "textEdit") as TextEditObject | undefined;
    if (existing) {
      setTextEditor({
        id: existing.id,
        pageIndex: existing.pageIndex,
        xRatio: existing.xRatio,
        yRatio: existing.yRatio,
        text: existing.text,
        runEdit: {
          wRatio: existing.wRatio,
          hRatio: existing.hRatio,
          baselineOffsetPt: existing.baselineOffsetPt,
          fontSizePt: existing.fontSize,
          fontFamily: existing.fontFamily,
          bold: existing.bold,
          italic: existing.italic,
          backgroundColor: existing.backgroundColor,
          color: existing.color,
        },
      });
      setSelectedId(existing.id);
      return;
    }

    const canvas = pageCanvasRef.current;
    const sampled = canvas ? sampleRunColors(canvas, run) : { background: WHITE, text: BLACK };
    setTextEditor({
      id: run.id,
      pageIndex: run.pageIndex,
      xRatio: run.xRatio,
      yRatio: run.yRatio,
      text: run.text,
      runEdit: {
        wRatio: run.wRatio,
        hRatio: run.hRatio,
        baselineOffsetPt: run.baselineOffsetPt,
        fontSizePt: run.fontSizePt,
        fontFamily: run.fontFamily,
        bold: run.bold,
        italic: run.italic,
        backgroundColor: sampled.background,
        color: sampled.text,
      },
    });
    setSelectedId(run.id);
  }

  function commitTextEditor() {
    if (!textEditor) return;
    const trimmed = textEditor.text;

    if (textEditor.runEdit) {
      const r = textEditor.runEdit;
      const obj: TextEditObject = {
        id: textEditor.id!,
        type: "textEdit",
        pageIndex: textEditor.pageIndex,
        xRatio: textEditor.xRatio,
        yRatio: textEditor.yRatio,
        wRatio: r.wRatio,
        hRatio: r.hRatio,
        baselineOffsetPt: r.baselineOffsetPt,
        backgroundColor: r.backgroundColor,
        text: trimmed,
        fontSize: r.fontSizePt,
        fontFamily: r.fontFamily,
        bold: r.bold,
        italic: r.italic,
        color: r.color,
      };
      const alreadyExists = objectsRef.current.some((o) => o.id === obj.id);
      commit(alreadyExists ? objectsRef.current.map((o) => (o.id === obj.id ? obj : o)) : [...objectsRef.current, obj]);
      setSelectedId(obj.id);
      setTextEditor(null);
      // Deliberately stays in the Edit Text tool — editing several existing lines in a row is the expected flow.
      return;
    }

    if (textEditor.id === null) {
      if (trimmed.trim()) {
        const obj: TextObject = {
          id: newId(),
          type: "text",
          pageIndex: textEditor.pageIndex,
          xRatio: textEditor.xRatio,
          yRatio: textEditor.yRatio,
          text: trimmed,
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          bold: style.bold,
          italic: style.italic,
          color: style.textColor,
        };
        commit([...objectsRef.current, obj]);
        setSelectedId(obj.id);
      }
    } else {
      const id = textEditor.id;
      if (!trimmed.trim()) {
        commit(objectsRef.current.filter((o) => o.id !== id));
        setSelectedId(null);
      } else {
        commit(objectsRef.current.map((o) => (o.id === id && o.type === "text" ? { ...o, text: trimmed } : o)));
      }
    }
    setTextEditor(null);
    setActiveTool("select");
  }

  // --- Canvas gestures ------------------------------------------------------------

  function handleCanvasClick(e: ReactPointerEvent<HTMLDivElement>) {
    if (activeTool !== "text") return;
    const { xRatio, yRatio } = ratioFromEvent(e);
    startNewText(xRatio, yRatio);
  }

  function handleCanvasPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (activeTool === "select") {
      setSelectedId(null);
      return;
    }
    if (activeTool === "text" || activeTool === "image" || activeTool === "editText") return;
    const { xRatio, yRatio } = ratioFromEvent(e);

    if (activeTool === "draw") {
      const obj: DrawObject = {
        id: newId(),
        type: "draw",
        pageIndex,
        points: [{ x: xRatio, y: yRatio }],
        strokeColor: style.strokeColor,
        strokeWidth: style.strokeWidth,
      };
      setLive([...objectsRef.current, obj]);
      dragRef.current = { mode: "draw", id: obj.id };
      return;
    }

    if (LINE_KINDS.has(activeTool as LineShapeKind)) {
      const obj: ShapeObject = {
        id: newId(),
        type: "shape",
        kind: activeTool as LineShapeKind,
        pageIndex,
        x1Ratio: xRatio,
        y1Ratio: yRatio,
        x2Ratio: xRatio,
        y2Ratio: yRatio,
        strokeColor: style.strokeColor,
        strokeWidth: style.strokeWidth,
        opacity: style.opacity,
      };
      setLive([...objectsRef.current, obj]);
      dragRef.current = { mode: "resize-line", id: obj.id, endpoint: "x2y2" };
      return;
    }

    if (BOX_DEFAULT_KINDS.has(activeTool as BoxShapeKind)) {
      const kind = activeTool as BoxShapeKind;
      const defaults =
        kind === "highlight"
          ? { fillColor: YELLOW as RGB | null, strokeColor: BLACK, strokeWidth: 0, opacity: 0.4, h: 0.045 }
          : kind === "cover"
            ? { fillColor: WHITE as RGB | null, strokeColor: BLACK, strokeWidth: 0, opacity: 1, h: 0.05 }
            : kind === "redact"
              ? { fillColor: REDACT_BLACK as RGB | null, strokeColor: REDACT_BLACK, strokeWidth: 0, opacity: 1, h: 0.05 }
              : {
                  fillColor: (style.fillEnabled ? style.fillColor : null) as RGB | null,
                  strokeColor: style.strokeColor,
                  strokeWidth: style.strokeWidth,
                  opacity: style.opacity,
                  h: 0.12,
                };
      const w = 0.22;
      const obj: ShapeObject = {
        id: newId(),
        type: "shape",
        kind,
        pageIndex,
        xRatio: Math.min(xRatio, 1 - w),
        yRatio: Math.min(yRatio, 1 - defaults.h),
        wRatio: w,
        hRatio: defaults.h,
        strokeColor: defaults.strokeColor,
        strokeWidth: defaults.strokeWidth,
        fillColor: defaults.fillColor,
        opacity: defaults.opacity,
      };
      commit([...objectsRef.current, obj]);
      setSelectedId(obj.id);
      setActiveTool("select");
    }
  }

  function anchorOf(obj: EditObject): { x: number; y: number } {
    if (obj.type === "draw") return { x: obj.points[0]?.x ?? 0, y: obj.points[0]?.y ?? 0 };
    if (obj.type === "shape" && isLineShape(obj)) return { x: obj.x1Ratio, y: obj.y1Ratio };
    if (obj.type === "shape") return { x: obj.xRatio, y: obj.yRatio };
    return { x: obj.xRatio, y: obj.yRatio };
  }

  function beginObjectDrag(e: ReactPointerEvent, obj: EditObject) {
    e.stopPropagation();
    if (activeTool !== "select") return;
    setSelectedId(obj.id);
    const { xRatio, yRatio } = ratioFromEvent(e);
    const anchor = anchorOf(obj);
    dragRef.current = { mode: "move-object", id: obj.id, grabDx: xRatio - anchor.x, grabDy: yRatio - anchor.y };
  }

  function beginResizeBox(e: ReactPointerEvent, id: string) {
    e.stopPropagation();
    dragRef.current = { mode: "resize-box", id };
  }

  function beginResizeLineEndpoint(e: ReactPointerEvent, id: string, endpoint: "x1y1" | "x2y2") {
    e.stopPropagation();
    dragRef.current = { mode: "resize-line", id, endpoint };
  }

  const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const xRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const yRatio = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    if (drag.mode === "move-object") {
      const nx = xRatio - drag.grabDx;
      const ny = yRatio - drag.grabDy;
      setLive(
        objectsRef.current.map((o) => {
          if (o.id !== drag.id) return o;
          if (o.type === "draw") {
            const dx = nx - (o.points[0]?.x ?? 0);
            const dy = ny - (o.points[0]?.y ?? 0);
            return { ...o, points: o.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
          }
          if (o.type === "shape" && isLineShape(o)) {
            const dx = nx - o.x1Ratio;
            const dy = ny - o.y1Ratio;
            return { ...o, x1Ratio: o.x1Ratio + dx, y1Ratio: o.y1Ratio + dy, x2Ratio: o.x2Ratio + dx, y2Ratio: o.y2Ratio + dy };
          }
          return { ...o, xRatio: nx, yRatio: ny } as EditObject;
        })
      );
      return;
    }

    if (drag.mode === "resize-box") {
      setLive(
        objectsRef.current.map((o) => {
          if (o.id !== drag.id || o.type === "draw" || o.type === "text" || (o.type === "shape" && isLineShape(o))) return o;
          const box = o as ImageObject | (ShapeObject & { xRatio: number; yRatio: number; wRatio: number; hRatio: number });
          const w = Math.max(0.015, xRatio - box.xRatio);
          const h = Math.max(0.015, yRatio - box.yRatio);
          return { ...box, wRatio: w, hRatio: h };
        })
      );
      return;
    }

    if (drag.mode === "resize-line" || drag.mode === "draw") {
      setLive(
        objectsRef.current.map((o) => {
          if (o.id !== drag.id) return o;
          if (drag.mode === "draw" && o.type === "draw") {
            return { ...o, points: [...o.points, { x: xRatio, y: yRatio }] };
          }
          if (drag.mode === "resize-line" && o.type === "shape" && isLineShape(o)) {
            return drag.endpoint === "x1y1" ? { ...o, x1Ratio: xRatio, y1Ratio: yRatio } : { ...o, x2Ratio: xRatio, y2Ratio: yRatio };
          }
          return o;
        })
      );
    }
  }, []);

  const handleGlobalPointerUp = useCallback(() => {
    if (dragRef.current) {
      commit(objectsRef.current);
    }
    dragRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex]);

  useEffect(() => {
    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);
    };
  }, [handleGlobalPointerMove, handleGlobalPointerUp]);

  // --- Keyboard shortcuts -----------------------------------------------------------

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inField = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (inField) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        commit(objectsRef.current.filter((o) => o.id !== selectedId));
        setSelectedId(null);
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setActiveTool("select");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, historyIndex, history]);

  // --- Image upload ------------------------------------------------------------------

  function handleImageToolClick() {
    imageInputRef.current?.click();
  }

  function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const mime = f.type.includes("png") ? "image/png" : f.type.includes("jpeg") || f.type.includes("jpg") ? "image/jpeg" : null;
    if (!mime) {
      setError("Images must be PNG or JPG.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const naturalAspect = img.naturalWidth / img.naturalHeight;
        const wRatio = 0.35;
        const hRatio = pageSizePt.height ? (wRatio * pageSizePt.width) / (naturalAspect * pageSizePt.height) : wRatio / naturalAspect;
        const obj: ImageObject = {
          id: newId(),
          type: "image",
          pageIndex,
          xRatio: Math.max(0, 0.5 - wRatio / 2),
          yRatio: Math.max(0, 0.5 - hRatio / 2),
          wRatio,
          hRatio,
          dataUrl,
          mime,
        };
        commit([...objectsRef.current, obj]);
        setSelectedId(obj.id);
        setActiveTool("select");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(f);
  }

  // --- Property panel updates ---------------------------------------------------------

  // The property panel only ever sends fields that are valid for the
  // currently-selected object's own type (enforced by its conditional
  // rendering below), so a loose merge is safe despite EditObject being a
  // discriminated union TypeScript can't narrow generically here.
  function updateSelected(patch: Record<string, unknown>) {
    if (!selected) return;
    commit(objectsRef.current.map((o) => (o.id === selected.id ? ({ ...o, ...patch } as EditObject) : o)));
  }

  function handleSave() {
    if (!buffer) return;
    if (objects.length === 0) {
      setError("Add at least one edit first.");
      return;
    }
    setBusy(true);
    setError(null);
    applyPdfEdits(buffer, objects)
      .then((bytes) => {
        downloadBlob(bytesToBlob(bytes, "application/pdf"), "edited.pdf");
      })
      .catch(() => {
        setError("Something went wrong editing that PDF.");
      })
      .finally(() => setBusy(false));
  }

  const pageObjects = objects.filter((o) => o.pageIndex === pageIndex);
  // Runs detected in the PDF's own text layer, plus any this page's OCR
  // pass has recognized — merged so every hitbox below (and the
  // double-click-to-reopen lookup) treats both sources identically.
  const currentPageRuns = [...textRuns.filter((r) => r.pageIndex === pageIndex), ...(ocrRunsByPage[pageIndex] ?? [])];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <ToolShell
      icon={FileEdit}
      title="Edit a PDF"
      description="A full editing toolkit — text, shapes, highlights, cover-ups, real redaction, images, and freehand drawing, all on the page."
    >
      {!file && (
        <Dropzone accept="application/pdf" onFiles={handleFile} label="Drop a PDF here, or click to browse" />
      )}

      {file && buffer && (
        <div className="space-y-5">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {pageCount > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                data-hover="true"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-brown-dark/15 text-brand-brown-dark disabled:opacity-30"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-brand-brown-dark/70">
                Page {pageIndex + 1} of {pageCount}
              </span>
              <button
                type="button"
                data-hover="true"
                disabled={pageIndex === pageCount - 1}
                onClick={() => setPageIndex((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-brown-dark/15 text-brand-brown-dark disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-brand-brown-dark/10 bg-white p-2">
            {TOOLS.map((t) => (
              <button
                key={t.id}
                type="button"
                data-hover="true"
                title={t.label}
                aria-label={t.label}
                aria-pressed={activeTool === t.id}
                onClick={() => {
                  setSelectedId(null);
                  if (t.id === "image") {
                    setActiveTool("select");
                    handleImageToolClick();
                  } else {
                    setActiveTool(t.id);
                  }
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  activeTool === t.id ? "bg-brand-blue-deep text-white" : "text-brand-brown-dark/70 hover:bg-brand-cream"
                }`}
              >
                <t.icon size={16} />
              </button>
            ))}
            <input ref={imageInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImageSelected} />

            <span className="mx-1 h-6 w-px bg-brand-brown-dark/10" />

            <button
              type="button"
              data-hover="true"
              title="Undo"
              disabled={!canUndo}
              onClick={undo}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-brown-dark/70 hover:bg-brand-cream disabled:opacity-30"
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              data-hover="true"
              title="Redo"
              disabled={!canRedo}
              onClick={redo}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-brown-dark/70 hover:bg-brand-cream disabled:opacity-30"
            >
              <Redo2 size={16} />
            </button>
            <button
              type="button"
              data-hover="true"
              title="Delete selected"
              disabled={!selected}
              onClick={() => {
                if (!selected) return;
                commit(objectsRef.current.filter((o) => o.id !== selected.id));
                setSelectedId(null);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-status-danger hover:bg-status-danger/10 disabled:text-brand-brown-dark/30 disabled:hover:bg-transparent"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Property panel */}
          <PropertyPanel activeTool={activeTool} selected={selected} style={style} setStyle={setStyle} updateSelected={updateSelected} />

          {activeTool === "editText" && scannedPages[pageIndex] && !ocrRunsByPage[pageIndex] && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <ScanText size={18} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-brand-brown-dark">This page looks like a scanned image</p>
                  <p className="text-xs text-brand-brown-dark/70">
                    It has no selectable text layer, so nothing here is clickable yet. Run OCR to recognize the
                    text and make it editable.
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={ocrLang}
                  onChange={(e) => setOcrLang(e.target.value as OcrLanguage)}
                  disabled={ocrBusy}
                  className="h-9 rounded-lg border border-brand-brown-dark/15 bg-white px-2 text-xs text-brand-brown-dark"
                  aria-label="OCR language"
                >
                  {OCR_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  data-hover="true"
                  onClick={handleRunOcr}
                  disabled={ocrBusy}
                  className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg bg-amber-600 px-3.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {ocrBusy ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      {ocrProgressPct > 0 ? `Recognizing… ${ocrProgressPct}%` : "Starting…"}
                    </>
                  ) : (
                    <>
                      <ScanText size={14} />
                      Run OCR and Enable Editing
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTool === "editText" && ocrRunsByPage[pageIndex] && (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-brand-brown-dark/80">
              <AlertTriangle size={14} className="shrink-0 text-amber-700" />
              Text on this page was recognized with OCR, not read from the PDF directly — please double-check it
              for mistakes before saving.
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
            <EditPageThumbRail
              fileBuffer={buffer}
              pageCount={pageCount}
              activeIndex={pageIndex}
              onSelect={setPageIndex}
            />

            <div
              ref={previewRef}
              onClick={handleCanvasClick}
              onPointerDown={handleCanvasPointerDown}
              className={`relative mx-auto overflow-hidden rounded-xl border border-brand-brown-dark/10 bg-white shadow-sm ${
                activeTool === "select" ? "" : "cursor-crosshair"
              }`}
              style={{
                width: PREVIEW_WIDTH,
                maxWidth: "100%",
                aspectRatio: pageSizePt.width ? `${pageSizePt.width} / ${pageSizePt.height}` : undefined,
                touchAction: "none",
              }}
            >
              <div ref={canvasHost} className="absolute inset-0" />

            {/* SVG overlay for lines, arrows, and freehand strokes */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${PREVIEW_WIDTH} ${previewHeight}`}>
              {pageObjects.map((o) => {
                if (o.type === "shape" && isLineShape(o)) {
                  const x1 = o.x1Ratio * PREVIEW_WIDTH;
                  const y1 = o.y1Ratio * previewHeight;
                  const x2 = o.x2Ratio * PREVIEW_WIDTH;
                  const y2 = o.y2Ratio * previewHeight;
                  const angle = Math.atan2(y2 - y1, x2 - x1);
                  const wingLen = 10;
                  const wingSpread = 0.4363;
                  return (
                    <g key={o.id} opacity={o.opacity}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={cssColor(o.strokeColor)}
                        strokeWidth={o.strokeWidth}
                        strokeLinecap="round"
                        className="pointer-events-auto cursor-move"
                        onPointerDown={(e) => beginObjectDrag(e, o)}
                      />
                      {o.kind === "arrow" && (
                        <>
                          <line
                            x1={x2}
                            y1={y2}
                            x2={x2 - wingLen * Math.cos(angle - wingSpread)}
                            y2={y2 - wingLen * Math.sin(angle - wingSpread)}
                            stroke={cssColor(o.strokeColor)}
                            strokeWidth={o.strokeWidth}
                            strokeLinecap="round"
                          />
                          <line
                            x1={x2}
                            y1={y2}
                            x2={x2 - wingLen * Math.cos(angle + wingSpread)}
                            y2={y2 - wingLen * Math.sin(angle + wingSpread)}
                            stroke={cssColor(o.strokeColor)}
                            strokeWidth={o.strokeWidth}
                            strokeLinecap="round"
                          />
                        </>
                      )}
                      {selectedId === o.id && (
                        <>
                          <circle cx={x1} cy={y1} r={5} fill="white" stroke={cssColor(BLUE)} strokeWidth={2} className="pointer-events-auto cursor-move" onPointerDown={(e) => beginResizeLineEndpoint(e, o.id, "x1y1")} />
                          <circle cx={x2} cy={y2} r={5} fill="white" stroke={cssColor(BLUE)} strokeWidth={2} className="pointer-events-auto cursor-move" onPointerDown={(e) => beginResizeLineEndpoint(e, o.id, "x2y2")} />
                        </>
                      )}
                    </g>
                  );
                }
                if (o.type === "draw") {
                  const points = o.points.map((p) => `${p.x * PREVIEW_WIDTH},${p.y * previewHeight}`).join(" ");
                  return (
                    <polyline
                      key={o.id}
                      points={points}
                      fill="none"
                      stroke={cssColor(o.strokeColor)}
                      strokeWidth={o.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-auto cursor-move"
                      onPointerDown={(e) => beginObjectDrag(e, o)}
                    />
                  );
                }
                return null;
              })}
            </svg>

            {activeTool === "editText" &&
              currentPageRuns
                .filter((run) => !pageObjects.some((o) => o.id === run.id))
                .map((run) => (
                  <div
                    key={run.id}
                    data-hover="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      // eslint-disable-next-line react-hooks/refs -- runs only from this click handler, same as the identical call a few lines below that isn't flagged; startEditingRun's ref reads never happen during render.
                      startEditingRun(run);
                    }}
                    title={
                      run.source === "ocr"
                        ? "Recognized via OCR — click to edit, and please double-check this text"
                        : "Click to edit this text"
                    }
                    className={`absolute cursor-text rounded-sm border border-dashed border-transparent ${
                      run.source === "ocr" ? "hover:border-amber-500/70 hover:bg-amber-400/10" : "hover:border-brand-blue/60 hover:bg-brand-blue/5"
                    }`}
                    style={{
                      left: run.xRatio * PREVIEW_WIDTH,
                      top: run.yRatio * previewHeight,
                      width: run.wRatio * PREVIEW_WIDTH,
                      height: run.hRatio * previewHeight,
                    }}
                  />
                ))}

            {pageObjects.map((o) => {
              if (o.type === "textEdit") {
                if (textEditor && textEditor.id === o.id) return null;
                const matchingRun = currentPageRuns.find((r) => r.id === o.id);
                return (
                  <div
                    key={o.id}
                    data-hover="true"
                    onPointerDown={(e) => beginObjectDrag(e, o)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (matchingRun) startEditingRun(matchingRun);
                    }}
                    className={`group absolute flex cursor-move touch-none select-none items-end overflow-hidden whitespace-pre px-px ${
                      selectedId === o.id ? "outline outline-2 outline-brand-blue" : ""
                    }`}
                    style={{
                      left: o.xRatio * PREVIEW_WIDTH,
                      top: o.yRatio * previewHeight,
                      width: o.wRatio * PREVIEW_WIDTH,
                      height: o.hRatio * previewHeight,
                      backgroundColor: cssColor(o.backgroundColor),
                      fontSize: o.fontSize * previewScale,
                      fontFamily: FONT_STACKS[o.fontFamily],
                      fontWeight: o.bold ? 700 : 400,
                      fontStyle: o.italic ? "italic" : "normal",
                      color: cssColor(o.color),
                      lineHeight: 1,
                    }}
                  >
                    {o.text}
                  </div>
                );
              }

              if (o.type === "text") {
                if (textEditor && textEditor.id === o.id) return null;
                return (
                  <div
                    key={o.id}
                    data-hover="true"
                    onPointerDown={(e) => beginObjectDrag(e, o)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEditingText(o);
                    }}
                    className={`group absolute cursor-move touch-none select-none whitespace-pre rounded px-1 ${
                      selectedId === o.id ? "outline outline-2 outline-brand-blue" : ""
                    }`}
                    style={{
                      left: o.xRatio * PREVIEW_WIDTH,
                      top: o.yRatio * previewHeight,
                      fontSize: o.fontSize * previewScale,
                      fontFamily: FONT_STACKS[o.fontFamily],
                      fontWeight: o.bold ? 700 : 400,
                      fontStyle: o.italic ? "italic" : "normal",
                      color: cssColor(o.color),
                      lineHeight: 1.25,
                    }}
                  >
                    {o.text}
                  </div>
                );
              }

              if (o.type === "image") {
                return (
                  <div
                    key={o.id}
                    data-hover="true"
                    onPointerDown={(e) => beginObjectDrag(e, o)}
                    className={`group absolute cursor-move touch-none select-none ${selectedId === o.id ? "outline outline-2 outline-brand-blue" : ""}`}
                    style={{
                      left: o.xRatio * PREVIEW_WIDTH,
                      top: o.yRatio * previewHeight,
                      width: o.wRatio * PREVIEW_WIDTH,
                      height: o.hRatio * previewHeight,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable static asset */}
                    <img src={o.dataUrl} alt="" className="h-full w-full object-fill" draggable={false} />
                    {selectedId === o.id && (
                      <div
                        onPointerDown={(e) => beginResizeBox(e, o.id)}
                        className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-brand-blue-deep"
                      />
                    )}
                  </div>
                );
              }

              if (o.type === "shape" && isBoxShape(o)) {
                const isPlain = o.kind === "highlight" || o.kind === "cover" || o.kind === "redact";
                return (
                  <div
                    key={o.id}
                    data-hover="true"
                    onPointerDown={(e) => beginObjectDrag(e, o)}
                    className={`group absolute flex cursor-move touch-none select-none items-center justify-center ${
                      selectedId === o.id ? "outline outline-2 outline-brand-blue" : o.kind === "redact" ? "outline outline-1 outline-dashed outline-status-danger" : ""
                    }`}
                    style={{
                      left: o.xRatio * PREVIEW_WIDTH,
                      top: o.yRatio * previewHeight,
                      width: o.wRatio * PREVIEW_WIDTH,
                      height: o.hRatio * previewHeight,
                      backgroundColor: o.fillColor ? cssColor(o.fillColor, o.opacity) : "transparent",
                      border: !isPlain && o.strokeWidth > 0 ? `${o.strokeWidth}px solid ${cssColor(o.strokeColor, o.opacity)}` : undefined,
                      borderRadius: o.kind === "ellipse" ? "50%" : undefined,
                    }}
                  >
                    {o.kind === "redact" && o.hRatio * previewHeight > 12 && (
                      <span className="pointer-events-none select-none text-[9px] font-bold uppercase tracking-wide text-white/70">
                        Redact
                      </span>
                    )}
                    {selectedId === o.id && (
                      <div
                        onPointerDown={(e) => beginResizeBox(e, o.id)}
                        className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-brand-blue-deep"
                      />
                    )}
                  </div>
                );
              }
              return null;
            })}

            {textEditor && textEditor.pageIndex === pageIndex && (
              <textarea
                autoFocus
                value={textEditor.text}
                onChange={(e) => setTextEditor({ ...textEditor, text: e.target.value })}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onBlur={commitTextEditor}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.currentTarget.blur();
                  }
                }}
                rows={1}
                className={`absolute z-10 resize-none overflow-hidden rounded border border-brand-blue px-1 outline-none ${
                  textEditor.runEdit ? "" : "min-w-[40px] bg-white/90"
                }`}
                style={
                  textEditor.runEdit
                    ? {
                        left: textEditor.xRatio * PREVIEW_WIDTH,
                        top: textEditor.yRatio * previewHeight,
                        width: textEditor.runEdit.wRatio * PREVIEW_WIDTH,
                        height: textEditor.runEdit.hRatio * previewHeight,
                        fontSize: textEditor.runEdit.fontSizePt * previewScale,
                        fontFamily: FONT_STACKS[textEditor.runEdit.fontFamily],
                        fontWeight: textEditor.runEdit.bold ? 700 : 400,
                        fontStyle: textEditor.runEdit.italic ? "italic" : "normal",
                        color: cssColor(textEditor.runEdit.color),
                        backgroundColor: cssColor(textEditor.runEdit.backgroundColor),
                        lineHeight: 1,
                      }
                    : {
                        left: textEditor.xRatio * PREVIEW_WIDTH,
                        top: textEditor.yRatio * previewHeight,
                        fontSize: style.fontSize * previewScale,
                        fontFamily: FONT_STACKS[style.fontFamily],
                        fontWeight: style.bold ? 700 : 400,
                        fontStyle: style.italic ? "italic" : "normal",
                        color: cssColor(style.textColor),
                        lineHeight: 1.25,
                      }
                }
              />
              )}
            </div>
          </div>

          <p className="text-xs text-brand-brown-dark/70">
            {objects.length} {objects.length === 1 ? "edit" : "edits"} across this PDF. Pick a tool above, click (or
            drag, for lines/arrows/drawing) on the page — select any edit to move, resize, or delete it.
          </p>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <MagneticButton onClick={handleSave} disabled={busy || objects.length === 0}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save & download"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}

function ColorSwatch({ value, onChange, label }: { value: RGB; onChange: (c: RGB) => void; label: string }) {
  return (
    <label className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-brand-brown-dark/15" title={label} style={{ backgroundColor: rgbToHex(value) }}>
      <input type="color" value={rgbToHex(value)} onChange={(e) => onChange(hexToRgb(e.target.value))} className="h-0 w-0 opacity-0" aria-label={label} />
    </label>
  );
}

function PropertyPanel({
  activeTool,
  selected,
  style,
  setStyle,
  updateSelected,
}: {
  activeTool: ToolId;
  selected: EditObject | null;
  style: Style;
  setStyle: React.Dispatch<React.SetStateAction<Style>>;
  updateSelected: (patch: Record<string, unknown>) => void;
}) {
  const kind = selected?.type ?? (activeTool === "select" ? null : activeTool === "image" ? "image" : activeTool === "draw" ? "draw" : activeTool === "text" ? "text" : LINE_KINDS.has(activeTool as LineShapeKind) ? "line" : BOX_DEFAULT_KINDS.has(activeTool as BoxShapeKind) ? "box" : null);

  if (!kind || kind === "image") return null;

  const isText = kind === "text" || kind === "textEdit";
  const selectedText = selected && (selected.type === "text" || selected.type === "textEdit") ? selected : null;
  const isBox = kind === "box" || (selected?.type === "shape" && isBoxShape(selected));
  const isLine = kind === "line" || (selected?.type === "shape" && isLineShape(selected));
  const isDraw = kind === "draw";
  const isPlainBox = selected?.type === "shape" && isBoxShape(selected) && (selected.kind === "highlight" || selected.kind === "cover");
  const isRedact = (selected?.type === "shape" && isBoxShape(selected) && selected.kind === "redact") || (!selected && activeTool === "redact");

  if (isRedact) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-status-danger/25 bg-status-danger/5 p-3 text-xs text-brand-brown-dark/70">
        <Ban size={14} className="shrink-0 text-status-danger" />
        Redaction is always solid black and permanently flattens that page — the covered content can&apos;t be recovered, and text on that page stops being selectable or searchable.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-brown-dark/10 bg-brand-cream/50 p-3 text-xs">
      {isText && (
        <>
          <select
            value={selectedText ? selectedText.fontFamily : style.fontFamily}
            onChange={(e) => {
              const fontFamily = e.target.value as FontFamily;
              setStyle((s) => ({ ...s, fontFamily }));
              if (selected) updateSelected({ fontFamily });
            }}
            className="h-8 rounded-lg border border-brand-brown-dark/15 bg-white px-2 text-brand-brown-dark"
          >
            {FONT_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {FONT_FAMILY_LABELS[f]}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={8}
            max={96}
            value={selectedText ? selectedText.fontSize : style.fontSize}
            onChange={(e) => {
              const fontSize = Number(e.target.value) || 16;
              setStyle((s) => ({ ...s, fontSize }));
              if (selected) updateSelected({ fontSize });
            }}
            className="h-8 w-16 rounded-lg border border-brand-brown-dark/15 bg-white px-2 text-brand-brown-dark"
            aria-label="Font size"
          />

          <button
            type="button"
            aria-pressed={selectedText ? selectedText.bold : style.bold}
            onClick={() => {
              const bold = !(selectedText ? selectedText.bold : style.bold);
              setStyle((s) => ({ ...s, bold }));
              if (selected) updateSelected({ bold });
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              (selectedText ? selectedText.bold : style.bold) ? "border-brand-blue bg-brand-blue/10 text-brand-blue-deep" : "border-brand-brown-dark/15 bg-white text-brand-brown-dark"
            }`}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            aria-pressed={selectedText ? selectedText.italic : style.italic}
            onClick={() => {
              const italic = !(selectedText ? selectedText.italic : style.italic);
              setStyle((s) => ({ ...s, italic }));
              if (selected) updateSelected({ italic });
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
              (selectedText ? selectedText.italic : style.italic) ? "border-brand-blue bg-brand-blue/10 text-brand-blue-deep" : "border-brand-brown-dark/15 bg-white text-brand-brown-dark"
            }`}
          >
            <Italic size={14} />
          </button>

          <ColorSwatch
            label="Text color"
            value={selectedText ? selectedText.color : style.textColor}
            onChange={(c) => {
              setStyle((s) => ({ ...s, textColor: c }));
              if (selected) updateSelected({ color: c });
            }}
          />
        </>
      )}

      {(isBox || isLine) && !isPlainBox && (
        <>
          <ColorSwatch
            label="Stroke color"
            value={selected && selected.type === "shape" ? selected.strokeColor : style.strokeColor}
            onChange={(c) => {
              setStyle((s) => ({ ...s, strokeColor: c }));
              if (selected) updateSelected({ strokeColor: c });
            }}
          />
          <label className="flex items-center gap-1.5 text-brand-brown-dark/70">
            Width
            <input
              type="range"
              min={0}
              max={12}
              value={selected && selected.type === "shape" ? selected.strokeWidth : style.strokeWidth}
              onChange={(e) => {
                const strokeWidth = Number(e.target.value);
                setStyle((s) => ({ ...s, strokeWidth }));
                if (selected) updateSelected({ strokeWidth });
              }}
              className="w-20"
            />
          </label>
        </>
      )}

      {isBox && !isPlainBox && (
        <label className="flex items-center gap-1.5 text-brand-brown-dark/70">
          <input
            type="checkbox"
            checked={selected && selected.type === "shape" && isBoxShape(selected) ? selected.fillColor !== null : style.fillEnabled}
            onChange={(e) => {
              const fillEnabled = e.target.checked;
              setStyle((s) => ({ ...s, fillEnabled }));
              if (selected) updateSelected({ fillColor: fillEnabled ? style.fillColor : null });
            }}
            className="h-3.5 w-3.5 accent-brand-blue-deep"
          />
          Fill
        </label>
      )}

      {isBox && !isPlainBox && (selected && selected.type === "shape" && isBoxShape(selected) ? selected.fillColor !== null : style.fillEnabled) && (
        <ColorSwatch
          label="Fill color"
          value={selected && selected.type === "shape" && isBoxShape(selected) && selected.fillColor ? selected.fillColor : style.fillColor}
          onChange={(c) => {
            setStyle((s) => ({ ...s, fillColor: c }));
            if (selected) updateSelected({ fillColor: c });
          }}
        />
      )}

      {isPlainBox && selected && selected.type === "shape" && isBoxShape(selected) && (
        <ColorSwatch
          label="Color"
          value={selected.fillColor ?? YELLOW}
          onChange={(c) => updateSelected({ fillColor: c })}
        />
      )}

      {isDraw && (
        <>
          <ColorSwatch
            label="Pen color"
            value={selected?.type === "draw" ? selected.strokeColor : style.strokeColor}
            onChange={(c) => {
              setStyle((s) => ({ ...s, strokeColor: c }));
              if (selected) updateSelected({ strokeColor: c });
            }}
          />
          <label className="flex items-center gap-1.5 text-brand-brown-dark/70">
            Width
            <input
              type="range"
              min={1}
              max={12}
              value={selected?.type === "draw" ? selected.strokeWidth : style.strokeWidth}
              onChange={(e) => {
                const strokeWidth = Number(e.target.value);
                setStyle((s) => ({ ...s, strokeWidth }));
                if (selected) updateSelected({ strokeWidth });
              }}
              className="w-20"
            />
          </label>
        </>
      )}

      {(isBox || isLine) && !isPlainBox && (
        <label className="flex items-center gap-1.5 text-brand-brown-dark/70">
          Opacity
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={selected?.type === "shape" ? selected.opacity : style.opacity}
            onChange={(e) => {
              const opacity = Number(e.target.value);
              setStyle((s) => ({ ...s, opacity }));
              if (selected) updateSelected({ opacity });
            }}
            className="w-16"
          />
        </label>
      )}
    </div>
  );
}
