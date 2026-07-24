"use client";

import { GalleryHorizontal, Loader2, MoveUp, MoveDown, X } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { mergeImages, type MergeDirection } from "@/lib/image/merge-images";
import { downloadBlob } from "@/lib/pdf/download";

export default function MergeImagesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [direction, setDirection] = useState<MergeDirection>("vertical");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function addFiles(newFiles: File[]) {
    setFiles((prev) => [...prev, ...newFiles]);
    setDone(false);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function reset() {
    setFiles([]);
    setError(null);
    setDone(false);
  }

  async function handleMerge() {
    if (files.length < 2) {
      setError("Add at least two images to merge.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const blob = await mergeImages(files, direction);
      downloadBlob(blob, "merged.png");
      setDone(true);
    } catch {
      setError("Something went wrong merging those images.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={GalleryHorizontal}
      title="Merge images"
      description="Combine several images into one — stacked top-to-bottom or side-by-side."
    >
      {files.length === 0 && (
        <Dropzone
          accept="image/*"
          multiple
          onFiles={addFiles}
          label="Drop images here, or click to browse"
          hint="Add two or more"
        />
      )}

      {files.length > 0 && (
        <div className="max-w-md space-y-6">
          <div className="space-y-2">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <FileChip name={f.name} size={f.size} onRemove={() => removeFile(i)} />
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label="Move up"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-brown-dark/15 text-brand-brown-dark/60 disabled:opacity-30"
                  >
                    <MoveUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={i === files.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Move down"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-brand-brown-dark/15 text-brand-brown-dark/60 disabled:opacity-30"
                  >
                    <MoveDown size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Dropzone accept="image/*" multiple onFiles={addFiles} label="Add more images" />

          <div>
            <p className="mb-3 text-sm font-semibold text-brand-brown-dark">Layout</p>
            <div className="flex gap-2">
              {(["vertical", "horizontal"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  data-hover="true"
                  onClick={() => setDirection(d)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    direction === d
                      ? "border-brand-blue bg-brand-blue/5 text-brand-blue-deep"
                      : "border-brand-brown-dark/10 text-brand-brown-dark/60 hover:border-brand-blue/30"
                  }`}
                >
                  {d === "vertical" ? "Stacked" : "Side by side"}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">Merged image downloaded.</p>}

          <div className="flex items-center gap-3">
            <MagneticButton onClick={handleMerge} disabled={busy || files.length < 2}>
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Merging…
                </>
              ) : (
                "Merge & download"
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
