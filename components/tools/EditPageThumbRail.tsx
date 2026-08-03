"use client";

import { useEffect, useRef, useState } from "react";
import { renderPageToCanvas } from "@/lib/pdf/pdfjs";

type EditPageThumbRailProps = {
  fileBuffer: ArrayBuffer;
  pageCount: number;
  activeIndex: number;
  onSelect: (pageIndex: number) => void;
};

export function EditPageThumbRail({ fileBuffer, pageCount, activeIndex, onSelect }: EditPageThumbRailProps) {
  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto rounded-2xl border border-brand-brown-dark/10 bg-white p-2 lg:sticky lg:top-28 lg:max-h-[70vh] lg:w-28 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto">
      {Array.from({ length: pageCount }, (_, i) => (
        <PageThumb
          key={i}
          fileBuffer={fileBuffer}
          pageIndex={i}
          active={i === activeIndex}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}

function PageThumb({
  fileBuffer,
  pageIndex,
  active,
  onClick,
}: {
  fileBuffer: ArrayBuffer;
  pageIndex: number;
  active: boolean;
  onClick: () => void;
}) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    renderPageToCanvas(fileBuffer, pageIndex + 1, 0.16).then((canvas) => {
      if (cancelled || !canvasHost.current) return;
      canvas.className = "h-full w-full object-contain";
      canvasHost.current.replaceChildren(canvas);
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
      onClick={onClick}
      aria-current={active}
      aria-label={`Page ${pageIndex + 1}`}
      className={`relative w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors lg:w-full ${
        active ? "border-brand-blue" : "border-transparent hover:border-brand-brown-dark/20"
      }`}
    >
      <div className="relative aspect-[3/4] w-full bg-brand-cream">
        <div ref={canvasHost} className="absolute inset-0 flex items-center justify-center p-1" />
        {!loaded && <div className="absolute inset-1 animate-pulse rounded bg-brand-brown-dark/5" />}
      </div>
      <span className="absolute bottom-1 right-1 rounded bg-brand-brown-dark/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
        {pageIndex + 1}
      </span>
    </button>
  );
}
