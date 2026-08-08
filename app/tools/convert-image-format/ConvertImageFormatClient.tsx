"use client";

import { ArrowRightLeft, Loader2, X } from "lucide-react";
import JSZip from "jszip";
import { useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { TabButton } from "@/components/tools/TabButton";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { convertImageFormat, type ImageMime } from "@/lib/image/convert-format";
import { downloadBlob } from "@/lib/pdf/download";

type Direction = "jpg-to-png" | "png-to-jpg";

const DIRECTION_CONFIG: Record<
  Direction,
  { accept: string; targetMime: ImageMime; ext: string; label: string }
> = {
  "jpg-to-png": { accept: "image/jpeg", targetMime: "image/png", ext: "png", label: "Drop JPG images here, or click to browse" },
  "png-to-jpg": { accept: "image/png", targetMime: "image/jpeg", ext: "jpg", label: "Drop PNG images here, or click to browse" },
};

export default function ConvertImageFormatPage() {
  const [direction, setDirection] = useState<Direction>("jpg-to-png");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);

  const config = DIRECTION_CONFIG[direction];

  function switchDirection(next: Direction) {
    setDirection(next);
    setFiles([]);
    setError(null);
  }

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
      const converted = await Promise.all(files.map((f) => convertImageFormat(f, config.targetMime)));

      if (converted.length === 1) {
        const baseName = files[0].name.replace(/\.[^.]+$/, "");
        downloadBlob(converted[0], `${baseName}.${config.ext}`);
      } else {
        const zip = new JSZip();
        converted.forEach((blob, i) => {
          const baseName = files[i].name.replace(/\.[^.]+$/, "");
          zip.file(`${baseName}.${config.ext}`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, `converted-${config.ext}.zip`);
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
      title="Convert Image Format"
      description="Convert between JPG and PNG — batch as many as you like."
    >
      <div className="mb-8 inline-flex rounded-full border border-brand-brown-dark/10 bg-white p-1">
        <TabButton active={direction === "jpg-to-png"} onClick={() => switchDirection("jpg-to-png")}>
          JPG → PNG
        </TabButton>
        <TabButton active={direction === "png-to-jpg"} onClick={() => switchDirection("png-to-jpg")}>
          PNG → JPG
        </TabButton>
      </div>

      {files.length === 0 && (
        <Dropzone accept={config.accept} multiple onFiles={addFiles} label={config.label} />
      )}

      {files.length > 0 && (
        <div className="max-w-md space-y-6">
          <div className="space-y-2">
            {files.map((f, i) => (
              <FileChip key={`${f.name}-${i}`} name={f.name} size={f.size} onRemove={() => removeFile(i)} />
            ))}
          </div>

          <Dropzone accept={config.accept} multiple onFiles={addFiles} label="Add more images" />

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
