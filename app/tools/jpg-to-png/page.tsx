"use client";

import { ArrowRightLeft, Loader2, X } from "lucide-react";
import JSZip from "jszip";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { convertImageFormat } from "@/lib/image/convert-format";
import { downloadBlob } from "@/lib/pdf/download";

export default function JpgToPngPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(newFiles: File[]) {
    setFiles((prev) => [...prev, ...newFiles]);
    setError(null);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function reset() {
    setFiles([]);
    setError(null);
  }

  async function handleConvert() {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const converted = await Promise.all(files.map((f) => convertImageFormat(f, "image/png")));

      if (converted.length === 1) {
        const baseName = files[0].name.replace(/\.[^.]+$/, "");
        downloadBlob(converted[0], `${baseName}.png`);
      } else {
        const zip = new JSZip();
        converted.forEach((blob, i) => {
          const baseName = files[i].name.replace(/\.[^.]+$/, "");
          zip.file(`${baseName}.png`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, "converted-png.zip");
      }
    } catch {
      setError("Something went wrong converting those images.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={ArrowRightLeft}
      title="JPG to PNG"
      description="Convert JPG images to PNG — batch as many as you like."
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

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <div className="flex items-center gap-3">
            <MagneticButton onClick={handleConvert} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Converting…
                </>
              ) : (
                "Convert & download"
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
