"use client";

import { useCallback, useEffect, useRef } from "react";

export type RatioBox = { x: number; y: number; w: number; h: number };

/**
 * A draggable, resizable selection rectangle overlaid on a page preview,
 * expressed in ratio coordinates (0-1 of the container) so it's independent
 * of the preview's pixel size. Shared by Crop PDF and Remove Watermark —
 * both just need "let the user mark a rectangle on the page."
 */
export function BoxSelector({
  box,
  onChange,
  containerSize,
  color = "border-brand-blue bg-brand-blue/10",
}: {
  box: RatioBox;
  onChange: (box: RatioBox) => void;
  containerSize: { width: number; height: number };
  color?: string;
}) {
  const dragState = useRef<{ mode: "move" | "resize"; startX: number; startY: number; box: RatioBox } | null>(
    null
  );

  const clamp = useCallback((b: RatioBox): RatioBox => {
    const w = Math.min(Math.max(b.w, 0.05), 1);
    const h = Math.min(Math.max(b.h, 0.05), 1);
    const x = Math.min(Math.max(b.x, 0), 1 - w);
    const y = Math.min(Math.max(b.y, 0), 1 - h);
    return { x, y, w, h };
  }, []);

  useEffect(() => {
    function handleMove(e: PointerEvent) {
      const state = dragState.current;
      if (!state || !containerSize.width || !containerSize.height) return;
      const dx = (e.clientX - state.startX) / containerSize.width;
      const dy = (e.clientY - state.startY) / containerSize.height;

      if (state.mode === "move") {
        onChange(clamp({ ...state.box, x: state.box.x + dx, y: state.box.y + dy }));
      } else {
        onChange(clamp({ ...state.box, w: state.box.w + dx, h: state.box.h + dy }));
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
  }, [clamp, containerSize, onChange]);

  return (
    <div
      data-hover="true"
      onPointerDown={(e) => {
        dragState.current = { mode: "move", startX: e.clientX, startY: e.clientY, box };
      }}
      className={`absolute cursor-move touch-none border-2 ${color}`}
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.w * 100}%`,
        height: `${box.h * 100}%`,
      }}
    >
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          dragState.current = { mode: "resize", startX: e.clientX, startY: e.clientY, box };
        }}
        className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border-2 border-white bg-brand-blue"
      />
    </div>
  );
}
