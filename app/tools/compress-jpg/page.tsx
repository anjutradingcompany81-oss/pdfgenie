"use client";

import { Shrink, Loader2, X } from "lucide-react";
import JSZip from "jszip";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { compressImage } from "@/lib/image/compress-images";
import { downloadBlob } from "@/lib/pdf/download";

export default function CompressJpgPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(70);
  const [busy, setBusy] = useState(false);
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
      const compressed = await Promise.all(files.map((f) => compressImage(f, quality / 100, "image/jpeg")));
      const before = files.reduce((sum, f) => sum + f.size, 0);
      const after = compressed.reduce((sum, b) => sum + b.size, 0);

      if (compressed.length === 1) {
        const baseName = files[0].name.replace(/\.[^.]+$/, "");
        downloadBlob(compressed[0], `${baseName}-compressed.jpg`);
      } else {
        const zip = new JSZip();
        compressed.forEach((blob, i) => {
          const baseName = files[i].name.replace(/\.[^.]+$/, "");
          zip.file(`${baseName}-compressed.jpg`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, "compressed-jpg.zip");
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
      icon={Shrink}
      title="Compress JPG"
      description="Shrink JPG file size — batch as many as you like."
    >
      {files.length === 0 && (
        <Dropzone
          accept="image/jpeg"
          multiple
          onFiles={addFiles}
          label="Drop JPG images here, or click to browse"
        />
      )}

      {files.length > 0 && (
        <div className="max-w-md space-y-6">
          <div className="space-y-2">
            {files.map((f, i) => (
              <FileChip key={`${f.name}-${i}`} name={f.name} size={f.size} onRemove={() => removeFile(i)} />
            ))}
          </div>

          <Dropzone accept="image/jpeg" multiple onFiles={addFiles} label="Add more images" />

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
              className="flex items-center gap-1 text-sm font-semibold text-brand-brown-dark/50 hover:text-brand-brown-dark"
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
