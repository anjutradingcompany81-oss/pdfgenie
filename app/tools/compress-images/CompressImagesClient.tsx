"use client";

import { Minimize2, Loader2, X } from "lucide-react";
import JSZip from "jszip";
import { useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { compressImage, FORMAT_EXTENSION, type CompressFormat } from "@/lib/image/compress-images";
import { downloadBlob } from "@/lib/pdf/download";

const FORMATS: { value: CompressFormat; label: string }[] = [
  { value: "image/jpeg", label: "JPG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/png", label: "PNG" },
];

export default function CompressImagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(70);
  const [format, setFormat] = useState<CompressFormat>("image/jpeg");
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ before: number; after: number } | null>(null);

  function addFiles(newFiles: File[]) {
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function reset() {
    setFiles([]);
    setError(null);
    setResult(null);
  }

  async function handleCompress() {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const compressed = await Promise.all(
        files.map((f) => compressImage(f, quality / 100, format))
      );
      const before = files.reduce((sum, f) => sum + f.size, 0);
      const after = compressed.reduce((sum, b) => sum + b.size, 0);
      const ext = FORMAT_EXTENSION[format];

      if (compressed.length === 1) {
        const baseName = files[0].name.replace(/\.[^.]+$/, "");
        downloadBlob(compressed[0], `${baseName}-compressed.${ext}`);
      } else {
        const zip = new JSZip();
        compressed.forEach((blob, i) => {
          const baseName = files[i].name.replace(/\.[^.]+$/, "");
          zip.file(`${baseName}-compressed.${ext}`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, "compressed-images.zip");
      }
      setResult({ before, after });
    } catch {
      setError("Something went wrong compressing those images.");
    } finally {
      setBusy(false);
    }
  }

  function formatSize(bytes: number) {
    return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <ToolShell
      icon={Minimize2}
      title="Compress images"
      description="Shrink JPG, PNG, or WebP images — batch as many as you like, any extension."
    >
      {files.length === 0 && (
        <Dropzone
          accept="image/*"
          multiple
          onFiles={addFiles}
          label="Drop images here, or click to browse"
        />
      )}

      {files.length > 0 && (
        <div className="max-w-md space-y-6">
          <div className="space-y-2">
            {files.map((f, i) => (
              <FileChip key={`${f.name}-${i}`} name={f.name} size={f.size} onRemove={() => removeFile(i)} />
            ))}
          </div>

          <Dropzone accept="image/*" multiple onFiles={addFiles} label="Add more images" />

          <div>
            <p className="mb-3 text-sm font-semibold text-brand-brown-dark">Output format</p>
            <div className="flex gap-2">
              {FORMATS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  data-hover="true"
                  onClick={() => setFormat(opt.value)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    format === opt.value
                      ? "border-brand-blue bg-brand-blue/5 text-brand-blue-deep"
                      : "border-brand-brown-dark/10 text-brand-brown-dark/70 hover:border-brand-blue/30"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {format !== "image/png" && (
            <div>
              <label htmlFor="quality" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Quality — {quality}%
              </label>
              <input
                id="quality"
                type="range"
                min={10}
                max={95}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-brand-blue-deep"
              />
            </div>
          )}

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {result && !error && (
            <p className="text-sm font-medium text-brand-blue-deep">
              {formatSize(result.before)} → {formatSize(result.after)} (
              {Math.round((1 - result.after / result.before) * 100)}% smaller)
            </p>
          )}

          <div className="flex items-center gap-3">
            <MagneticButton onClick={handleCompress} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Compressing…
                </>
              ) : (
                "Compress & download"
              )}
            </MagneticButton>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-sm font-semibold text-brand-brown-dark/70 hover:text-brand-brown-dark"
            >
              <X size={14} />
              Clear all
            </button>
          </div>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
