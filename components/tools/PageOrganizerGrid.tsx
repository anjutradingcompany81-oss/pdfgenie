"use client";

import { RotateCw, Trash2, GripVertical } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { renderPageToCanvas } from "@/lib/pdf/pdfjs";
import type { OrganizedPage } from "@/lib/pdf/reorganize";

export type OrganizerPage = OrganizedPage & { id: string };

export function PageOrganizerGrid({
  fileBuffer,
  pages,
  onChange,
}: {
  fileBuffer: ArrayBuffer;
  pages: OrganizerPage[];
  onChange: (next: OrganizerPage[]) => void;
}) {
  const dragIndex = useRef<number | null>(null);

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex) return;
    const next = [...pages];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  }

  function rotate(id: string) {
    onChange(
      pages.map((p) => (p.id === id ? { ...p, rotation: (((p.rotation + 90) % 360) as 0 | 90 | 180 | 270) } : p))
    );
  }

  function remove(id: string) {
    onChange(pages.filter((p) => p.id !== id));
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {pages.map((page, index) => (
        <div
          key={page.id}
          draggable
          onDragStart={() => {
            dragIndex.current = index;
          }}
          onDragOver={(e: DragEvent) => e.preventDefault()}
          onDrop={() => handleDrop(index)}
          className="group relative flex aspect-[3/4] cursor-grab flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-brand-brown-dark/10 bg-white transition-colors active:cursor-grabbing hover:border-brand-blue/40"
        >
          <div
            className="relative flex h-full w-full items-center justify-center p-2 transition-transform"
            style={{ transform: `rotate(${page.rotation}deg)` }}
          >
            <PageThumbnail fileBuffer={fileBuffer} pageIndex={page.originalIndex} />
          </div>

          <span className="absolute bottom-2 left-2 rounded-full bg-brand-brown-dark/80 px-2 py-0.5 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-brand-brown-dark/70">
            <GripVertical size={14} />
          </span>

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent py-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => rotate(page.id)}
              aria-label="Rotate page"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-brown-dark shadow"
            >
              <RotateCw size={13} />
            </button>
            <button
              type="button"
              onClick={() => remove(page.id)}
              aria-label="Delete page"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-status-danger shadow"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PageThumbnail({ fileBuffer, pageIndex }: { fileBuffer: ArrayBuffer; pageIndex: number }) {
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
    <div className="relative flex h-full w-full items-center justify-center">
      <div ref={canvasHost} className="flex h-full w-full items-center justify-center" />
      {!loaded && <div className="absolute inset-2 animate-pulse rounded bg-brand-brown-dark/5" />}
    </div>
  );
}
