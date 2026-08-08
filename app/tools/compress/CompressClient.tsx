"use client";

import { FileArchive, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { lightCompress, strongCompress } from "@/lib/pdf/compress";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

type Mode = "standard" | "maximum";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("standard");
  const [busy, setBusy] = useToolBusy();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);

  function handleFile(files: File[]) {
    setFile(files[0] ?? null);
    setResult(null);
    setError(null);
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
  }

  async function handleCompress() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);
    try {
      const buffer = await file.arrayBuffer();
      const bytes =
        mode === "standard"
          ? await lightCompress(buffer)
          : await strongCompress(buffer, (done, total) =>
              setProgress(Math.round((done / total) * 100))
            );

      downloadBlob(bytesToBlob(bytes, "application/pdf"), "compressed.pdf");
      setResult({ before: file.size, after: bytes.byteLength });
    } catch {
      setError("Couldn't compress that PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={FileArchive}
      title="Compress a PDF"
      description="Shrink file size while keeping your document readable."
    >
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <div className="space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div>
            <p className="mb-3 text-sm font-semibold text-brand-brown-dark">
              Compression level
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ModeCard
                title="Standard"
                description="Optimizes file structure. Lossless — text stays crisp and selectable."
                selected={mode === "standard"}
                onClick={() => setMode("standard")}
              />
              <ModeCard
                title="Maximum"
                description="Redraws each page as a compressed image. Much smaller, best for scans and image-heavy PDFs."
                selected={mode === "maximum"}
                onClick={() => setMode("maximum")}
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          {result && (
            <p className="text-sm font-medium text-brand-blue-deep">
              {formatSize(result.before)} → {formatSize(result.after)} (
              {Math.max(
                0,
                Math.round((1 - result.after / result.before) * 100)
              )}
              % smaller)
            </p>
          )}

          <MagneticButton onClick={handleCompress} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {mode === "maximum" && progress > 0 ? `Compressing… ${progress}%` : "Compressing…"}
              </>
            ) : (
              "Compress PDF"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}

function ModeCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-hover="true"
      onClick={onClick}
      className={`rounded-2xl border-2 p-5 text-left transition-colors ${
        selected
          ? "border-brand-blue bg-brand-blue/5"
          : "border-brand-brown-dark/10 bg-white hover:border-brand-blue/30"
      }`}
    >
      <p className="font-semibold text-brand-brown-dark">{title}</p>
      <p className="mt-1 text-sm text-brand-brown-dark/70">{description}</p>
    </button>
  );
}
