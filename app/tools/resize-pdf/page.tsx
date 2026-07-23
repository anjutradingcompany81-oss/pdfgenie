"use client";

import { Scaling, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { resizePdf } from "@/lib/pdf/organize";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

const MM_TO_PT = 72 / 25.4;

const PRESETS = [
  { id: "a4", label: "A4", widthMm: 210, heightMm: 297 },
  { id: "letter", label: "US Letter", widthMm: 215.9, heightMm: 279.4 },
  { id: "legal", label: "US Legal", widthMm: 215.9, heightMm: 355.6 },
  { id: "a3", label: "A3", widthMm: 297, heightMm: 420 },
  { id: "custom", label: "Custom", widthMm: 210, heightMm: 297 },
] as const;

export default function ResizePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [presetId, setPresetId] = useState<(typeof PRESETS)[number]["id"]>("a4");
  const [widthMm, setWidthMm] = useState(210);
  const [heightMm, setHeightMm] = useState(297);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function selectPreset(id: (typeof PRESETS)[number]["id"]) {
    setPresetId(id);
    const preset = PRESETS.find((p) => p.id === id);
    if (preset && id !== "custom") {
      setWidthMm(preset.widthMm);
      setHeightMm(preset.heightMm);
    }
  }

  function reset() {
    setFile(null);
    setError(null);
    setDone(false);
  }

  async function handleResize() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = await resizePdf(buffer, widthMm * MM_TO_PT, heightMm * MM_TO_PT);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "resized.pdf");
      setDone(true);
    } catch {
      setError("Couldn't resize that PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={Scaling}
      title="Resize a PDF"
      description="Rescale every page to a new paper size, from A4 to a size of your own."
    >
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div>
            <p className="mb-3 text-sm font-semibold text-brand-brown-dark">Paper size</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  data-hover="true"
                  onClick={() => selectPreset(preset.id)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    presetId === preset.id
                      ? "border-brand-blue bg-brand-blue/5 text-brand-blue-deep"
                      : "border-brand-brown-dark/10 text-brand-brown-dark/60 hover:border-brand-blue/30"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="resize-width" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Width (mm)
              </label>
              <input
                id="resize-width"
                type="number"
                min={10}
                value={widthMm}
                onChange={(e) => {
                  setPresetId("custom");
                  setWidthMm(Number(e.target.value) || 0);
                }}
                className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="resize-height" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Height (mm)
              </label>
              <input
                id="resize-height"
                type="number"
                min={10}
                value={heightMm}
                onChange={(e) => {
                  setPresetId("custom");
                  setHeightMm(Number(e.target.value) || 0);
                }}
                className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {done && !error && (
            <p className="text-sm font-medium text-brand-blue-deep">Resized PDF downloaded.</p>
          )}

          <MagneticButton onClick={handleResize} disabled={busy || widthMm <= 0 || heightMm <= 0}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Resizing…
              </>
            ) : (
              "Resize PDF"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
