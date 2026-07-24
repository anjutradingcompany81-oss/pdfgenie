"use client";

import { Stamp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { BoxSelector, type RatioBox } from "@/components/tools/BoxSelector";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { addWatermark } from "@/lib/pdf/watermark";
import { coverArea } from "@/lib/pdf/redact";
import { getPageSize, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

type Direction = "add" | "remove";

export default function WatermarkPage() {
  const [direction, setDirection] = useState<Direction>("add");

  return (
    <ToolShell
      icon={Stamp}
      title="Watermark"
      description="Stamp text across every page, or cover a repeated watermark that's already there."
    >
      <div className="mb-8 inline-flex rounded-full border border-brand-brown-dark/10 bg-white p-1">
        <TabButton active={direction === "add"} onClick={() => setDirection("add")}>
          Add watermark
        </TabButton>
        <TabButton active={direction === "remove"} onClick={() => setDirection("remove")}>
          Remove watermark
        </TabButton>
      </div>

      {direction === "add" ? <AddWatermark /> : <RemoveWatermark />}

      <PrivacyNote />
    </ToolShell>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      data-hover="true"
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-brand-blue-deep text-white" : "text-brand-brown-dark/60 hover:text-brand-brown-dark"
      }`}
    >
      {children}
    </button>
  );
}

function AddWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setFile(null);
    setError(null);
    setDone(false);
  }

  async function handleWatermark() {
    if (!file) return;
    if (!text.trim()) {
      setError("Enter some watermark text first.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = await addWatermark(buffer, text.trim(), opacity / 100);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "watermarked.pdf");
      setDone(true);
    } catch {
      setError("Couldn't watermark that PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div>
            <label htmlFor="watermark-text" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
              Watermark text
            </label>
            <input
              id="watermark-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={40}
              className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              placeholder="e.g. CONFIDENTIAL"
            />
          </div>

          <div>
            <label htmlFor="watermark-opacity" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
              Opacity — {opacity}%
            </label>
            <input
              id="watermark-opacity"
              type="range"
              min={5}
              max={80}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-brand-blue-deep"
            />
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && (
            <p className="text-sm font-medium text-brand-blue-deep">Watermarked PDF downloaded.</p>
          )}

          <MagneticButton onClick={handleWatermark} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Watermarking…
              </>
            ) : (
              "Add watermark"
            )}
          </MagneticButton>
        </>
      )}
    </div>
  );
}

const PREVIEW_WIDTH = 640;
const DEFAULT_BOX: RatioBox = { x: 0.25, y: 0.4, w: 0.5, h: 0.2 };

function RemoveWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageSizePt, setPageSizePt] = useState({ width: 0, height: 0 });
  const [box, setBox] = useState<RatioBox>(DEFAULT_BOX);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasHost = useRef<HTMLDivElement>(null);
  const previewHeight = pageSizePt.width ? pageSizePt.height * (PREVIEW_WIDTH / pageSizePt.width) : 0;

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    try {
      const buf = await f.arrayBuffer();
      const size = await getPageSize(buf, 1);
      setFile(f);
      setBuffer(buf);
      setPageSizePt(size);
      setBox(DEFAULT_BOX);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setError(null);
  }

  useEffect(() => {
    if (!buffer || !pageSizePt.width || !canvasHost.current) return;
    let cancelled = false;
    const scale = PREVIEW_WIDTH / pageSizePt.width;
    renderPageToCanvas(buffer, 1, scale).then((canvas) => {
      if (cancelled || !canvasHost.current) return;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvasHost.current.replaceChildren(canvas);
    });
    return () => {
      cancelled = true;
    };
  }, [buffer, pageSizePt.width]);

  async function handleRemove() {
    if (!buffer) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await coverArea(buffer, box);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "watermark-removed.pdf");
    } catch {
      setError("Something went wrong on that PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone accept="application/pdf" onFiles={handleFile} label="Drop a PDF here, or click to browse" />
      )}

      {file && buffer && (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/50">
            Drag the box over the watermark — it gets covered with white on every page. Best for a
            watermark that repeats in the same spot.
          </p>

          <div
            className="relative mx-auto overflow-hidden rounded-xl border border-brand-brown-dark/10 bg-white shadow-sm"
            style={{ width: PREVIEW_WIDTH, maxWidth: "100%", aspectRatio: pageSizePt.width ? `${pageSizePt.width} / ${pageSizePt.height}` : undefined }}
          >
            <div ref={canvasHost} className="absolute inset-0" />
            <BoxSelector
              box={box}
              onChange={setBox}
              containerSize={{ width: PREVIEW_WIDTH, height: previewHeight }}
              color="border-status-danger bg-status-danger/10"
            />
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <MagneticButton onClick={handleRemove} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Covering…
              </>
            ) : (
              "Cover & download"
            )}
          </MagneticButton>
        </>
      )}
    </div>
  );
}
