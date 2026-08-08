"use client";

import { RotateCw, RotateCcw, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { rotatePdf } from "@/lib/pdf/rotate";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

const OPTIONS = [
  { value: 90 as const, label: "90° clockwise", icon: RotateCw },
  { value: 270 as const, label: "90° counter-clockwise", icon: RotateCcw },
  { value: 180 as const, label: "180°", icon: RotateCw },
];

export default function RotatePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setFile(null);
    setError(null);
    setDone(false);
  }

  async function handleRotate() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = await rotatePdf(buffer, rotation);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "rotated.pdf");
      setDone(true);
    } catch {
      setError("Couldn't rotate that PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={RotateCw}
      title="Rotate a PDF"
      description="Turn every page of a PDF 90°, 180°, or 270°."
    >
      {!file && (
        <Dropzone accept="application/pdf" onFiles={(files) => setFile(files[0] ?? null)} label="Drop a PDF here, or click to browse" />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div>
            <p className="mb-3 text-sm font-semibold text-brand-brown-dark">Rotation</p>
            <div className="flex flex-wrap gap-2">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  data-hover="true"
                  onClick={() => setRotation(opt.value)}
                  className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    rotation === opt.value
                      ? "border-brand-blue bg-brand-blue/5 text-brand-blue-deep"
                      : "border-brand-brown-dark/10 text-brand-brown-dark/70 hover:border-brand-blue/30"
                  }`}
                >
                  <opt.icon size={15} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">Rotated PDF downloaded.</p>}

          <MagneticButton onClick={handleRotate} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Rotating…
              </>
            ) : (
              "Rotate PDF"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
