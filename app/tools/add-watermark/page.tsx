"use client";

import { Stamp, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { addWatermark } from "@/lib/pdf/watermark";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function AddWatermarkPage() {
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
    <ToolShell
      icon={Stamp}
      title="Add a watermark to a PDF"
      description="Stamp text diagonally across every page — great for drafts and confidential files."
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

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
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
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
