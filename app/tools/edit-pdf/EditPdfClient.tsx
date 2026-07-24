"use client";

import { FileEdit, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageCount, getPageSize, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { applyTextAnnotations, type TextAnnotation } from "@/lib/pdf/edit";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

const PREVIEW_WIDTH = 640;

type Note = TextAnnotation & { id: string };

const COLORS = [
  { label: "Black", value: { r: 0.09, g: 0.075, b: 0.06 } },
  { label: "Red", value: { r: 0.85, g: 0.1, b: 0.1 } },
  { label: "Blue", value: { r: 0.1, g: 0.3, b: 0.85 } },
];

export default function EditPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSizePt, setPageSizePt] = useState({ width: 0, height: 0 });
  const [notes, setNotes] = useState<Note[]>([]);
  const [draftText, setDraftText] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const [colorIndex, setColorIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasHost = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);
  const previewScale = pageSizePt.width ? PREVIEW_WIDTH / pageSizePt.width : 1;
  const previewHeight = pageSizePt.height * previewScale;

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
      setNotes([]);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setPageCount(0);
    setPageIndex(0);
    setNotes([]);
    setError(null);
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
    renderPageToCanvas(buffer, pageIndex + 1, scale).then((canvas) => {
      if (cancelled || !canvasHost.current) return;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvasHost.current.replaceChildren(canvas);
    });
    return () => {
      cancelled = true;
    };
  }, [buffer, pageIndex, pageSizePt.width]);

  function handlePreviewClick(e: ReactMouseEvent<HTMLDivElement>) {
    if (!draftText.trim() || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;
    if (xRatio < 0 || xRatio > 1 || yRatio < 0 || yRatio > 1) return;

    setNotes((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        pageIndex,
        xRatio,
        yRatio,
        text: draftText.trim(),
        fontSize,
        color: COLORS[colorIndex].value,
      },
    ]);
    setDraftText("");
  }

  function removeNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      const id = dragId.current;
      if (!id || !previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const xRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const yRatio = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, xRatio, yRatio } : n)));
    }
    function handleUp() {
      dragId.current = null;
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  async function handleApply() {
    if (!buffer) return;
    if (notes.length === 0) {
      setError("Add at least one piece of text first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const bytes = await applyTextAnnotations(buffer, notes);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "edited.pdf");
    } catch {
      setError("Something went wrong editing that PDF.");
    } finally {
      setBusy(false);
    }
  }

  const pageNotes = notes.filter((n) => n.pageIndex === pageIndex);

  return (
    <ToolShell
      icon={FileEdit}
      title="Edit a PDF"
      description="Drop in text anywhere on the page — add as many notes as you need, drag to reposition, then save."
    >
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && buffer && (
        <div className="space-y-6">
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

          <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
            <input
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="Type text, then click on the page to place it"
              className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
            />
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="rounded-full border border-brand-brown-dark/15 bg-white px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              aria-label="Font size"
            >
              {[12, 14, 16, 20, 24, 32].map((s) => (
                <option key={s} value={s}>
                  {s}px
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1.5 rounded-full border border-brand-brown-dark/15 bg-white px-3">
              {COLORS.map((c, i) => (
                <button
                  key={c.label}
                  type="button"
                  aria-label={c.label}
                  onClick={() => setColorIndex(i)}
                  className={`h-6 w-6 rounded-full border-2 ${colorIndex === i ? "border-brand-blue" : "border-transparent"}`}
                  style={{ backgroundColor: `rgb(${c.value.r * 255}, ${c.value.g * 255}, ${c.value.b * 255})` }}
                />
              ))}
            </div>
          </div>

          <div
            ref={previewRef}
            onClick={handlePreviewClick}
            className={`relative mx-auto overflow-hidden rounded-xl border border-brand-brown-dark/10 bg-white shadow-sm ${draftText.trim() ? "cursor-crosshair" : ""}`}
            style={{ width: PREVIEW_WIDTH, maxWidth: "100%", aspectRatio: pageSizePt.width ? `${pageSizePt.width} / ${pageSizePt.height}` : undefined }}
          >
            <div ref={canvasHost} className="absolute inset-0" />
            {pageNotes.map((note) => (
              <div
                key={note.id}
                data-hover="true"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  dragId.current = note.id;
                }}
                className="group absolute cursor-move touch-none select-none whitespace-nowrap rounded border border-brand-blue/40 bg-white/70 px-1"
                style={{
                  left: note.xRatio * PREVIEW_WIDTH,
                  top: note.yRatio * previewHeight,
                  fontSize: note.fontSize * previewScale,
                  color: `rgb(${note.color.r * 255}, ${note.color.g * 255}, ${note.color.b * 255})`,
                }}
              >
                {note.text}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNote(note.id);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Remove this text"
                  className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-brown-dark text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-brand-brown-dark/70">
            {notes.length} {notes.length === 1 ? "note" : "notes"} added across this PDF. Type text
            above, then click on the page to drop it — drag any note to reposition it.
          </p>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <MagneticButton onClick={handleApply} disabled={busy || notes.length === 0}>
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
