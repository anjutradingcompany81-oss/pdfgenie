"use client";

import { Signature, Loader2, ChevronLeft, ChevronRight, Copy, Check, Info } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageCount, getPageSize, renderPageToCanvas } from "@/lib/pdf/pdfjs";

const PREVIEW_WIDTH = 640;

type Box = { x: number; y: number; w: number; h: number };

export default function RequestSignaturePage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSizePt, setPageSizePt] = useState({ width: 0, height: 0 });
  const [dragBox, setDragBox] = useState<Box | null>(null);
  const [lastPageIndex, setLastPageIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canvasHost = useRef<HTMLDivElement>(null);
  const previewScale = pageSizePt.width ? PREVIEW_WIDTH / pageSizePt.width : 1;
  const previewHeight = pageSizePt.height * previewScale;

  // Reset the placement box to its default spot whenever the selected page changes.
  if (pageIndex !== lastPageIndex) {
    setLastPageIndex(pageIndex);
    setDragBox(null);
  }
  const defaultBox: Box = { x: 220, y: Math.max(0, previewHeight - 120), w: 200, h: 60 };
  const box = dragBox ?? defaultBox;
  const setBox = setDragBox;

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
      setLink(null);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setPageCount(0);
    setPageIndex(0);
    setLastPageIndex(0);
    setDragBox(null);
    setLink(null);
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

  async function handleCreateLink() {
    if (!file || !buffer || !pageSizePt.width) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("pageIndex", String(pageIndex));
      form.append("xRatio", String(box.x / PREVIEW_WIDTH));
      form.append("yRatio", String(box.y / previewHeight));
      form.append("wRatio", String(box.w / PREVIEW_WIDTH));
      form.append("hRatio", String(box.h / previewHeight));
      form.append("pageWidthPt", String(pageSizePt.width));
      form.append("pageHeightPt", String(pageSizePt.height));

      const res = await fetch("/api/signature-requests", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");

      setLink(`${window.location.origin}/sign/${data.token}`);
    } catch {
      setError("Something went wrong creating that link.");
    } finally {
      setBusy(false);
    }
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ToolShell
      icon={Signature}
      title="Request a signature"
      description="Mark where a signature goes, then share the link — anyone who opens it can sign, no account needed."
    >
      <div className="mb-6 flex items-start gap-2 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-xs text-brand-brown-dark/70">
        <Info size={14} className="mt-0.5 shrink-0 text-brand-blue-deep" />
        <p>
          Unlike every other tool here, this one stores the PDF on our server — that&apos;s the
          only way a link can work for someone else to open. It&apos;s deleted from public access
          once you&apos;re done linking to it, but it isn&apos;t processed purely in your browser
          the way the rest of the site is.
        </p>
      </div>

      {!file && (
        <Dropzone accept="application/pdf" onFiles={handleFile} label="Drop a PDF here, or click to browse" />
      )}

      {file && buffer && !link && (
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

          <p className="text-sm text-brand-brown-dark/70">
            Drag the box to where the signature should go.
          </p>

          <div
            className="relative mx-auto overflow-hidden rounded-xl border border-brand-brown-dark/10 bg-white shadow-sm"
            style={{
              width: PREVIEW_WIDTH,
              maxWidth: "100%",
              aspectRatio: pageSizePt.width ? `${pageSizePt.width} / ${pageSizePt.height}` : undefined,
            }}
          >
            <div ref={canvasHost} className="absolute inset-0" />
            <PlacementBox box={box} setBox={setBox} bounds={{ width: PREVIEW_WIDTH, height: previewHeight }} />
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <MagneticButton onClick={handleCreateLink} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating link…
              </>
            ) : (
              "Create signing link"
            )}
          </MagneticButton>
        </div>
      )}

      {link && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5">
            <p className="text-sm font-semibold text-emerald-700">Link created</p>
            <p className="mt-1 text-sm text-brand-brown-dark/70">
              Send this to whoever needs to sign. Revisit it yourself any time to check status or
              download the signed copy.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-brand-brown-dark/15 bg-white px-4 py-3">
            <input readOnly value={link} className="min-w-0 flex-1 truncate bg-transparent text-sm text-brand-brown-dark outline-none" />
            <button
              type="button"
              data-hover="true"
              onClick={copyLink}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-blue-deep px-3 py-1.5 text-xs font-semibold text-white"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            data-hover="true"
            onClick={reset}
            className="text-sm font-semibold text-brand-blue-deep hover:underline"
          >
            Create another request
          </button>
        </div>
      )}
    </ToolShell>
  );
}

function PlacementBox({
  box,
  setBox,
  bounds,
}: {
  box: Box;
  setBox: (b: Box) => void;
  bounds: { width: number; height: number };
}) {
  const dragState = useRef<{ mode: "move" | "resize"; startX: number; startY: number; box: Box } | null>(null);

  const clamp = useCallback(
    (b: Box): Box => {
      const w = Math.min(Math.max(b.w, 80), bounds.width);
      const h = w * 0.3;
      const x = Math.min(Math.max(b.x, 0), Math.max(0, bounds.width - w));
      const y = Math.min(Math.max(b.y, 0), Math.max(0, bounds.height - h));
      return { x, y, w, h };
    },
    [bounds]
  );

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      const state = dragState.current;
      if (!state) return;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      if (state.mode === "move") {
        setBox(clamp({ ...state.box, x: state.box.x + dx, y: state.box.y + dy }));
      } else {
        setBox(clamp({ ...state.box, w: state.box.w + dx }));
      }
    }
    function handleUp() {
      dragState.current = null;
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [clamp, setBox]);

  return (
    <div
      data-hover="true"
      onPointerDown={(e) => {
        dragState.current = { mode: "move", startX: e.clientX, startY: e.clientY, box };
      }}
      className="absolute flex cursor-move touch-none items-center justify-center border-2 border-dashed border-brand-blue bg-brand-blue/10"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
    >
      <span className="pointer-events-none select-none text-xs font-semibold uppercase tracking-wide text-brand-blue-deep">
        Signature goes here
      </span>
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          dragState.current = { mode: "resize", startX: e.clientX, startY: e.clientY, box };
        }}
        className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-brand-blue-deep"
      />
    </div>
  );
}
