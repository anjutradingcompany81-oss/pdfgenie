"use client";

import { Maximize2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { resizeImage } from "@/lib/image/resize-image";
import { downloadBlob } from "@/lib/pdf/download";

export default function ResizeJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [lockAspect, setLockAspect] = useState(true);
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setDone(false);
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    };
    img.src = URL.createObjectURL(f);
  }

  function reset() {
    setFile(null);
    setNaturalSize(null);
    setError(null);
    setDone(false);
  }

  function setWidthLocked(next: number) {
    setWidth(next);
    if (lockAspect && naturalSize) {
      setHeight(Math.round((next / naturalSize.width) * naturalSize.height));
    }
  }

  function setHeightLocked(next: number) {
    setHeight(next);
    if (lockAspect && naturalSize) {
      setWidth(Math.round((next / naturalSize.height) * naturalSize.width));
    }
  }

  async function handleResize() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const blob = await resizeImage(file, width, height);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const ext = blob.type === "image/png" ? "png" : "jpg";
      downloadBlob(blob, `${baseName}-resized.${ext}`);
      setDone(true);
    } catch {
      setError("Something went wrong resizing that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={Maximize2}
      title="Resize a JPG"
      description="Set new dimensions and download a resized copy."
    >
      {!file && (
        <Dropzone
          accept="image/jpeg"
          onFiles={handleFile}
          label="Drop a JPG here, or click to browse"
        />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- quick client-side preview of a user-selected file
            <img
              src={previewUrl}
              alt={`Preview of ${file.name}`}
              className="max-h-64 w-full rounded-xl border border-brand-brown-dark/10 object-contain"
            />
          )}

          {naturalSize && (
            <p className="text-xs text-brand-brown-dark/70">
              Original: {naturalSize.width} × {naturalSize.height}px
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="width" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Width (px)
              </label>
              <input
                id="width"
                type="number"
                min={1}
                value={width}
                onChange={(e) => setWidthLocked(Number(e.target.value) || 1)}
                className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="height" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Height (px)
              </label>
              <input
                id="height"
                type="number"
                min={1}
                value={height}
                onChange={(e) => setHeightLocked(Number(e.target.value) || 1)}
                className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-brown-dark/70">
            <input
              type="checkbox"
              checked={lockAspect}
              onChange={(e) => setLockAspect(e.target.checked)}
              className="h-4 w-4 rounded border-brand-brown-dark/30 accent-brand-blue-deep"
            />
            Lock aspect ratio
          </label>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">Resized image downloaded.</p>}

          <MagneticButton onClick={handleResize} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Resizing…
              </>
            ) : (
              "Resize & download"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
