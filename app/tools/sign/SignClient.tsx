"use client";

import { PenTool, Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { SignaturePad } from "@/components/tools/SignaturePad";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageCount, getPageSize, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { embedSignature } from "@/lib/pdf/sign";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

const PREVIEW_WIDTH = 640;

type Stamp = { dataUrl: string; naturalWidth: number; naturalHeight: number };
type Box = { x: number; y: number; w: number; h: number };

export default function SignPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSizePt, setPageSizePt] = useState({ width: 0, height: 0 });
  const [stamp, setStamp] = useState<Stamp | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);

  const canvasHost = useRef<HTMLDivElement>(null);
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
      setStamp(null);
      setBox(null);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setPageCount(0);
    setPageIndex(0);
    setStamp(null);
    setBox(null);
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

  function handleStampCreate(dataUrl: string, naturalWidth: number, naturalHeight: number) {
    const w = Math.min(220, PREVIEW_WIDTH * 0.4);
    const h = (naturalHeight / naturalWidth) * w;
    setStamp({ dataUrl, naturalWidth, naturalHeight });
    setBox({
      x: (PREVIEW_WIDTH - w) / 2,
      y: Math.max(0, previewHeight / 2 - h / 2),
      w,
      h,
    });
  }

  async function handleSign() {
    if (!buffer || !stamp || !box) {
      setError("Add a signature and place it on the page first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(stamp.dataUrl);
      const pngBytes = new Uint8Array(await res.arrayBuffer());

      const pdfW = box.w / previewScale;
      const pdfH = box.h / previewScale;
      const pdfX = box.x / previewScale;
      const pdfY = pageSizePt.height - box.y / previewScale - pdfH;

      const bytes = await embedSignature(buffer, pageIndex, pngBytes, {
        x: pdfX,
        y: pdfY,
        width: pdfW,
        height: pdfH,
      });
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "signed.pdf");
    } catch {
      setError("Something went wrong signing that PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={PenTool}
      title="Sign a PDF"
      description="Draw or type your signature, then drop it right where you need it."
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

          <div
            className="relative mx-auto overflow-hidden rounded-xl border border-brand-brown-dark/10 bg-white shadow-sm"
            style={{ width: PREVIEW_WIDTH, maxWidth: "100%", aspectRatio: pageSizePt.width ? `${pageSizePt.width} / ${pageSizePt.height}` : undefined }}
          >
            <div ref={canvasHost} className="absolute inset-0" />
            {stamp && box && (
              <SignatureOverlay
                stamp={stamp}
                box={box}
                setBox={setBox}
                bounds={{ width: PREVIEW_WIDTH, height: previewHeight }}
                onRemove={() => {
                  setStamp(null);
                  setBox(null);
                }}
              />
            )}
          </div>

          {!stamp && <SignaturePad onCreate={handleStampCreate} />}

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <MagneticButton onClick={handleSign} disabled={busy || !stamp}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Signing…
              </>
            ) : (
              "Sign & download"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}

function SignatureOverlay({
  stamp,
  box,
  setBox,
  bounds,
  onRemove,
}: {
  stamp: Stamp;
  box: Box;
  setBox: (b: Box) => void;
  bounds: { width: number; height: number };
  onRemove: () => void;
}) {
  const dragState = useRef<{ mode: "move" | "resize"; startX: number; startY: number; box: Box } | null>(null);

  const clamp = useCallback(
    (b: Box): Box => {
      const w = Math.min(Math.max(b.w, 40), bounds.width);
      const h = w * (stamp.naturalHeight / stamp.naturalWidth);
      const x = Math.min(Math.max(b.x, 0), Math.max(0, bounds.width - w));
      const y = Math.min(Math.max(b.y, 0), Math.max(0, bounds.height - h));
      return { x, y, w, h };
    },
    [bounds, stamp]
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
      className="absolute cursor-move touch-none"
      style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
    >
      <div className="group relative h-full w-full border-2 border-brand-blue">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stamp.dataUrl}
          alt="Your signature"
          draggable={false}
          className="h-full w-full select-none object-contain"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Remove signature"
          className="absolute -right-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-brown-dark text-white shadow"
        >
          <X size={12} />
        </button>
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            dragState.current = { mode: "resize", startX: e.clientX, startY: e.clientY, box };
          }}
          className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-brand-blue"
        />
      </div>
    </div>
  );
}
