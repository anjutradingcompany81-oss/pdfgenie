"use client";

import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getPageSize, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import type { SignatureAppearance, SigningDetails, RGB } from "@/lib/pdf/dsc/types";
import type { CertificateInfo } from "@/lib/pdf/dsc/certificate";

const ZOOM_LEVELS = [480, 640, 800, 960];

export type PlacementValue = { xRatio: number; yRatio: number; wRatio: number; hRatio: number };

function cssColor(c: RGB, alpha = 1): string {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}

type DragMode = "move" | "resize" | null;

export function PdfPlacementCanvas({
  buffer,
  pageCount,
  pageIndex,
  onPageIndexChange,
  value,
  onChange,
  readOnly = false,
  stampPreview,
}: {
  buffer: ArrayBuffer;
  pageCount: number;
  pageIndex: number;
  onPageIndexChange: (index: number) => void;
  value: PlacementValue;
  onChange: (value: PlacementValue) => void;
  readOnly?: boolean;
  /** When provided, renders an approximate visual stamp preview instead of the plain edit box (used by the Preview step). */
  stampPreview?: { appearance: SignatureAppearance; details: SigningDetails; certInfo: CertificateInfo };
}) {
  const [zoomIndex, setZoomIndex] = useState(1);
  const width = ZOOM_LEVELS[zoomIndex];
  const [pageSizePt, setPageSizePt] = useState({ width: 0, height: 0 });

  const canvasHost = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: DragMode; grabDx: number; grabDy: number } | null>(null);

  const previewScale = pageSizePt.width ? width / pageSizePt.width : 1;
  const previewHeight = pageSizePt.height * previewScale;

  useEffect(() => {
    let cancelled = false;
    getPageSize(buffer, pageIndex + 1).then((size) => {
      if (!cancelled) setPageSizePt(size);
    });
    return () => {
      cancelled = true;
    };
  }, [buffer, pageIndex]);

  useEffect(() => {
    if (!pageSizePt.width || !canvasHost.current) return;
    let cancelled = false;
    const scale = width / pageSizePt.width;
    renderPageToCanvas(buffer, pageIndex + 1, scale)
      .then((canvas) => {
        if (cancelled || !canvasHost.current) return;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.display = "block";
        canvasHost.current.replaceChildren(canvas);
      })
      .catch(() => {
        // Background reference image only — placement math doesn't depend on it.
      });
    return () => {
      cancelled = true;
    };
  }, [buffer, pageIndex, pageSizePt.width, width]);

  function ratioFromEvent(e: { clientX: number; clientY: number }) {
    const rect = previewRef.current!.getBoundingClientRect();
    return {
      xRatio: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      yRatio: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }

  function handleBoxPointerDown(e: ReactPointerEvent) {
    if (readOnly) return;
    e.stopPropagation();
    const { xRatio, yRatio } = ratioFromEvent(e);
    dragRef.current = { mode: "move", grabDx: xRatio - value.xRatio, grabDy: yRatio - value.yRatio };
  }

  function handleResizePointerDown(e: ReactPointerEvent) {
    if (readOnly) return;
    e.stopPropagation();
    dragRef.current = { mode: "resize", grabDx: 0, grabDy: 0 };
  }

  function handleCanvasClick(e: ReactPointerEvent<HTMLDivElement>) {
    if (readOnly) return;
    const { xRatio, yRatio } = ratioFromEvent(e);
    onChange({
      xRatio: Math.min(xRatio, 1 - value.wRatio),
      yRatio: Math.min(yRatio, 1 - value.hRatio),
      wRatio: value.wRatio,
      hRatio: value.hRatio,
    });
  }

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag || !previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const xRatio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const yRatio = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      if (drag.mode === "move") {
        onChange({
          ...value,
          xRatio: Math.min(1 - value.wRatio, Math.max(0, xRatio - drag.grabDx)),
          yRatio: Math.min(1 - value.hRatio, Math.max(0, yRatio - drag.grabDy)),
        });
      } else if (drag.mode === "resize") {
        onChange({
          ...value,
          wRatio: Math.max(0.05, Math.min(1 - value.xRatio, xRatio - value.xRatio)),
          hRatio: Math.max(0.03, Math.min(1 - value.yRatio, yRatio - value.yRatio)),
        });
      }
    }
    function handleUp() {
      dragRef.current = null;
    }
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function jumpToPage(raw: string, input: HTMLInputElement) {
    const n = parseInt(raw, 10);
    if (Number.isInteger(n) && n >= 1 && n <= pageCount) {
      onPageIndexChange(n - 1);
    } else {
      input.value = String(pageIndex + 1);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dsc-border bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-hover="true"
            disabled={pageIndex === 0}
            onClick={() => onPageIndexChange(pageIndex - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dsc-ink hover:bg-dsc-surface disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <input
            key={pageIndex}
            defaultValue={pageIndex + 1}
            onBlur={(e) => jumpToPage(e.target.value, e.target)}
            onKeyDown={(e) => e.key === "Enter" && jumpToPage(e.currentTarget.value, e.currentTarget)}
            className="h-8 w-12 rounded-lg border border-dsc-border text-center text-sm text-dsc-ink"
            aria-label="Page number"
          />
          <span className="text-sm text-dsc-ink-muted">of {pageCount}</span>
          <button
            type="button"
            data-hover="true"
            disabled={pageIndex === pageCount - 1}
            onClick={() => onPageIndexChange(pageIndex + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dsc-ink hover:bg-dsc-surface disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            data-hover="true"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((z) => z - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dsc-ink hover:bg-dsc-surface disabled:opacity-30"
            aria-label="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="w-12 text-center text-xs font-semibold text-dsc-ink-muted">{Math.round((width / 640) * 100)}%</span>
          <button
            type="button"
            data-hover="true"
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIndex((z) => z + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dsc-ink hover:bg-dsc-surface disabled:opacity-30"
            aria-label="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            data-hover="true"
            onClick={() => setZoomIndex(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dsc-ink hover:bg-dsc-surface"
            aria-label="Fit width"
            title="Fit width"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      <div
        ref={previewRef}
        onClick={handleCanvasClick}
        className={`relative mx-auto overflow-hidden rounded-xl border border-dsc-border bg-white shadow-sm ${readOnly ? "" : "cursor-crosshair"}`}
        style={{ width, maxWidth: "100%", aspectRatio: pageSizePt.width ? `${pageSizePt.width} / ${pageSizePt.height}` : undefined }}
      >
        <div ref={canvasHost} className="absolute inset-0" />

        <div
          onPointerDown={handleBoxPointerDown}
          className={`absolute flex items-center justify-center overflow-hidden rounded-md border-2 ${readOnly ? "border-dsc-accent/70" : "cursor-move border-dsc-primary bg-dsc-primary/10"}`}
          style={{
            left: value.xRatio * width,
            top: value.yRatio * previewHeight,
            width: value.wRatio * width,
            height: value.hRatio * previewHeight,
            backgroundColor: stampPreview && stampPreview.appearance.backgroundEnabled ? cssColor(stampPreview.appearance.backgroundColor, stampPreview.appearance.opacity) : undefined,
          }}
        >
          {stampPreview ? (
            <div
              className="flex h-full w-full flex-col justify-center gap-0.5 overflow-hidden px-1.5 leading-tight"
              style={{ color: cssColor(stampPreview.appearance.textColor) }}
            >
              {stampPreview.appearance.showName && (
                <span style={{ fontSize: Math.max(6, stampPreview.appearance.fontSize * previewScale) }}>
                  Digitally signed by {stampPreview.certInfo.ownerName}
                </span>
              )}
              {stampPreview.appearance.showReason && stampPreview.details.reason && (
                <span style={{ fontSize: Math.max(6, stampPreview.appearance.fontSize * previewScale) }}>
                  Reason: {stampPreview.details.reason}
                </span>
              )}
              {(stampPreview.appearance.showDate || stampPreview.appearance.showTime) && (
                <span style={{ fontSize: Math.max(6, stampPreview.appearance.fontSize * previewScale) }}>
                  {stampPreview.details.signingTime.toLocaleDateString()}
                </span>
              )}
            </div>
          ) : (
            <span className="pointer-events-none select-none text-xs font-semibold text-dsc-primary">Signature</span>
          )}

          {!readOnly && (
            <div
              onPointerDown={handleResizePointerDown}
              className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-dsc-primary"
            />
          )}
        </div>
      </div>
    </div>
  );
}
