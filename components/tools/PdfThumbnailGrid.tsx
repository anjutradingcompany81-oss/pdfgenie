"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { renderPageToCanvas } from "@/lib/pdf/pdfjs";

type PdfThumbnailGridProps = {
  fileBuffer: ArrayBuffer;
  pageCount: number;
  selected: Set<number>;
  onToggle: (pageIndex: number) => void;
};

export function PdfThumbnailGrid({
  fileBuffer,
  pageCount,
  selected,
  onToggle,
}: PdfThumbnailGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: pageCount }, (_, i) => (
        <PageThumbnail
          key={i}
          fileBuffer={fileBuffer}
          pageIndex={i}
          isSelected={selected.has(i)}
          onToggle={() => onToggle(i)}
        />
      ))}
    </div>
  );
}

function PageThumbnail({
  fileBuffer,
  pageIndex,
  isSelected,
  onToggle,
}: {
  fileBuffer: ArrayBuffer;
  pageIndex: number;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    renderPageToCanvas(fileBuffer, pageIndex + 1, 0.35).then((canvas) => {
      if (cancelled || !canvasHost.current) return;
      canvasHost.current.replaceChildren(canvas);
      canvas.className = "w-full h-full object-contain";
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  return (
    <button
      type="button"
      data-hover="true"
      onClick={onToggle}
      aria-pressed={isSelected}
      className={`group relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-xl border-2 bg-white transition-colors ${
        isSelected ? "border-brand-blue" : "border-brand-brown-dark/10 hover:border-brand-blue/40"
      }`}
    >
      <div className="relative flex h-full w-full items-center justify-center p-2">
        <div ref={canvasHost} className="flex h-full w-full items-center justify-center" />
        {!loaded && (
          <div className="absolute inset-2 animate-pulse rounded bg-brand-brown-dark/5" />
        )}
      </div>

      <span className="absolute bottom-2 left-2 rounded-full bg-brand-brown-dark/80 px-2 py-0.5 text-xs font-semibold text-white">
        {pageIndex + 1}
      </span>

      <span
        className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
          isSelected
            ? "border-brand-blue bg-brand-blue text-white"
            : "border-brand-brown-dark/20 bg-white/80 text-transparent"
        }`}
      >
        <Check size={14} strokeWidth={3} />
      </span>
    </button>
  );
}
