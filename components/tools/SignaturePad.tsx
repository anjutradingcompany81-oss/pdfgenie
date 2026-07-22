"use client";

import { useRef, useState, type PointerEvent } from "react";
import { Caveat } from "next/font/google";

const caveat = Caveat({ subsets: ["latin"], weight: ["600"] });

type SignaturePadProps = {
  onCreate: (dataUrl: string, width: number, height: number) => void;
};

export function SignaturePad({ onCreate }: SignaturePadProps) {
  const [tab, setTab] = useState<"draw" | "type">("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStroke = useRef(false);
  const [typedName, setTypedName] = useState("");

  function getCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    return { canvas, ctx };
  }

  function pointerPos(e: PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function handlePointerDown(e: PointerEvent<HTMLCanvasElement>) {
    const c = getCanvas();
    if (!c) return;
    drawing.current = true;
    const { x, y } = pointerPos(e, c.canvas);
    c.ctx.beginPath();
    c.ctx.moveTo(x, y);
    c.canvas.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const c = getCanvas();
    if (!c) return;
    const { x, y } = pointerPos(e, c.canvas);
    c.ctx.lineTo(x, y);
    c.ctx.strokeStyle = "#17130f";
    c.ctx.lineWidth = 3;
    c.ctx.lineCap = "round";
    c.ctx.lineJoin = "round";
    c.ctx.stroke();
    hasStroke.current = true;
  }

  function handlePointerUp() {
    drawing.current = false;
  }

  function clearCanvas() {
    const c = getCanvas();
    if (!c) return;
    c.ctx.clearRect(0, 0, c.canvas.width, c.canvas.height);
    hasStroke.current = false;
  }

  function useDrawnSignature() {
    const c = getCanvas();
    if (!c || !hasStroke.current) return;
    onCreate(c.canvas.toDataURL("image/png"), c.canvas.width, c.canvas.height);
  }

  function useTypedSignature() {
    if (!typedName.trim()) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#17130f";
    ctx.font = `64px ${caveat.style.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2);
    onCreate(canvas.toDataURL("image/png"), canvas.width, canvas.height);
  }

  return (
    <div className="rounded-2xl border border-brand-brown-dark/10 bg-white p-5">
      <div className="mb-4 inline-flex rounded-full border border-brand-brown-dark/10 p-1">
        <button
          type="button"
          data-hover="true"
          onClick={() => setTab("draw")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "draw" ? "bg-brand-blue-deep text-white" : "text-brand-brown-dark/60"
          }`}
        >
          Draw
        </button>
        <button
          type="button"
          data-hover="true"
          onClick={() => setTab("type")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            tab === "type" ? "bg-brand-blue-deep text-white" : "text-brand-brown-dark/60"
          }`}
        >
          Type
        </button>
      </div>

      {tab === "draw" ? (
        <div>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full touch-none rounded-xl border border-dashed border-brand-brown-dark/20 bg-brand-cream"
            style={{ aspectRatio: "3 / 1" }}
          />
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              data-hover="true"
              onClick={clearCanvas}
              className="text-sm font-semibold text-brand-brown-dark/60 hover:text-brand-brown-dark"
            >
              Clear
            </button>
            <button
              type="button"
              data-hover="true"
              onClick={useDrawnSignature}
              className="text-sm font-semibold text-brand-blue-deep hover:underline"
            >
              Use this signature
            </button>
          </div>
        </div>
      ) : (
        <div>
          <input
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Type your name"
            className="w-full rounded-xl border border-brand-brown-dark/15 bg-brand-cream px-4 py-3 text-2xl text-brand-brown-dark placeholder:text-base placeholder:font-sans placeholder:text-brand-brown-dark/35 focus:border-brand-blue focus:outline-none"
            style={{ fontFamily: caveat.style.fontFamily }}
          />
          <button
            type="button"
            data-hover="true"
            onClick={useTypedSignature}
            disabled={!typedName.trim()}
            className="mt-3 text-sm font-semibold text-brand-blue-deep hover:underline disabled:opacity-40"
          >
            Use this signature
          </button>
        </div>
      )}
    </div>
  );
}
