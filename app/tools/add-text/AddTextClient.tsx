"use client";

import { Type, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageCount, getPageSize, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { addTextToPdf } from "@/lib/pdf/organize";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

const PREVIEW_WIDTH = 640;

export default function AddTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSizePt, setPageSizePt] = useState({ width: 0, height: 0 });
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(18);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasHost = useRef<HTMLDivElement>(null);
  const previewScale = pageSizePt.width ? PREVIEW_WIDTH / pageSizePt.width : 1;

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
      setPoint(null);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setPageCount(0);
    setPageIndex(0);
    setPoint(null);
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

  function handlePreviewClick(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  async function handleAddText() {
    if (!buffer || !point || !text.trim()) {
      setError("Type some text and click on the page to place it first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const pdfX = point.x / previewScale;
      const pdfY = pageSizePt.height - point.y / previewScale;
      const bytes = await addTextToPdf(buffer, pageIndex, text, pdfX, pdfY, fontSize);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "text-added.pdf");
    } catch {
      setError("Something went wrong adding that text.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={Type}
      title="Add text to a PDF"
      description="Type a line of text, click where it should go, and download the result."
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
                onClick={() => {
                  setPageIndex((p) => p - 1);
                  setPoint(null);
                }}
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
                onClick={() => {
                  setPageIndex((p) => p + 1);
                  setPoint(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-brown-dark/15 text-brand-brown-dark disabled:opacity-30"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="add-text-value" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Text
              </label>
              <input
                id="add-text-value"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type something to add"
                className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              />
            </div>
            <div className="w-28">
              <label htmlFor="add-text-size" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Size
              </label>
              <input
                id="add-text-size"
                type="number"
                min={8}
                max={72}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value) || 18)}
                className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              />
            </div>
          </div>

          <p className="text-sm text-brand-brown-dark/70">
            Click on the page below to choose where your text goes.
          </p>

          <div
            onClick={handlePreviewClick}
            data-hover="true"
            className="relative mx-auto cursor-crosshair overflow-hidden rounded-xl border border-brand-brown-dark/10 bg-white shadow-sm"
            style={{
              width: PREVIEW_WIDTH,
              maxWidth: "100%",
              aspectRatio: pageSizePt.width ? `${pageSizePt.width} / ${pageSizePt.height}` : undefined,
            }}
          >
            <div ref={canvasHost} className="absolute inset-0" />
            {point && (
              <span
                className="pointer-events-none absolute -translate-x-1 translate-y-[-100%] whitespace-nowrap font-semibold text-brand-blue-deep"
                style={{ left: point.x, top: point.y, fontSize: Math.max(10, fontSize * previewScale) }}
              >
                {text || "Your text"}
              </span>
            )}
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <MagneticButton onClick={handleAddText} disabled={busy || !point || !text.trim()}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Adding…
              </>
            ) : (
              "Add text & download"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
