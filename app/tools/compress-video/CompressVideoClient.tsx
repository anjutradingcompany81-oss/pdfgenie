"use client";

import { FileVideo, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { downloadBlob } from "@/lib/pdf/download";

const QUALITY_OPTIONS = [
  { value: "high", label: "Higher quality", hint: "Larger file" },
  { value: "balanced", label: "Balanced", hint: "Recommended" },
  { value: "small", label: "Smaller file", hint: "More compression" },
] as const;

function compressVideo(
  file: File,
  quality: string,
  onProgress: (pct: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("quality", quality);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/tools/compress-video");
    xhr.responseType = "blob";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response as Blob);
      } else {
        xhr.response
          .text()
          .then((text: string) => {
            try {
              reject(new Error(JSON.parse(text).error || "Compression failed."));
            } catch {
              reject(new Error("Compression failed."));
            }
          })
          .catch(() => reject(new Error("Compression failed.")));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.send(formData);
  });
}

export default function CompressVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<string>("balanced");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setDone(false);
  }

  function reset() {
    setFile(null);
    setError(null);
    setDone(false);
    setProgress(0);
  }

  async function handleCompress() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDone(false);
    setProgress(0);
    try {
      const blob = await compressVideo(file, quality, setProgress);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      downloadBlob(blob, `${baseName}-compressed.mp4`);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't compress that video.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  return (
    <ToolShell
      icon={FileVideo}
      title="Compress a video"
      description="Shrink a video's file size while keeping it watchable — outputs an MP4."
    >
      {!file && (
        <Dropzone
          accept="video/*"
          onFiles={handleFile}
          label="Drop a video here, or click to browse"
          hint="Up to 300MB"
        />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div>
            <p className="mb-3 text-sm font-semibold text-brand-brown-dark">Quality</p>
            <div className="flex flex-wrap gap-2">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  data-hover="true"
                  onClick={() => setQuality(opt.value)}
                  className={`rounded-full border-2 px-4 py-2 text-left text-sm font-semibold transition-colors ${
                    quality === opt.value
                      ? "border-brand-blue bg-brand-blue/5 text-brand-blue-deep"
                      : "border-brand-brown-dark/10 text-brand-brown-dark/70 hover:border-brand-blue/30"
                  }`}
                >
                  {opt.label}
                  <span className="ml-1.5 font-normal text-brand-brown-dark/70">({opt.hint})</span>
                </button>
              ))}
            </div>
          </div>

          {busy && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-brand-brown-dark/70">
                {progress < 100 ? `Uploading… ${progress}%` : "Compressing on the server…"}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-brand-brown-dark/10">
                <div
                  className="h-full rounded-full bg-brand-blue-deep transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">Compressed video downloaded.</p>}

          <MagneticButton onClick={handleCompress} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Working…
              </>
            ) : (
              "Compress & download"
            )}
          </MagneticButton>
        </div>
      )}

      <p className="mt-6 flex items-start gap-2 text-xs text-brand-brown-dark/70">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        Unlike other tools here, video compression needs real processing power — your video is
        uploaded to our server to compress it, then deleted immediately afterward. It&apos;s never
        stored or looked at.
      </p>
    </ToolShell>
  );
}
