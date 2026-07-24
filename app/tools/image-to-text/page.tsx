"use client";

import { ScanLine } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { imageToText, type OcrImageProgress } from "@/lib/image/image-to-text";
import { downloadBlob } from "@/lib/pdf/download";

export default function ImageToTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<OcrImageProgress | null>(null);

  function reset() {
    setFile(null);
    setText(null);
    setError(null);
    setProgress(null);
  }

  async function handleExtract(f: File) {
    setBusy(true);
    setError(null);
    setText(null);
    setProgress(null);
    try {
      const result = await imageToText(f, setProgress);
      setText(result.trim() || "(No text found in that image.)");
    } catch {
      setError("Couldn't read text from that image.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    handleExtract(f);
  }

  function handleDownload() {
    if (!text || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    downloadBlob(new Blob([text], { type: "text/plain" }), `${baseName}.txt`);
  }

  return (
    <ToolShell
      icon={ScanLine}
      title="Image to text"
      description="Pull the text out of a photo, screenshot, or scan into a plain .txt file."
    >
      {!file && (
        <Dropzone
          accept="image/*"
          onFiles={handleFile}
          label="Drop an image here, or click to browse"
        />
      )}

      {file && (
        <div className="max-w-lg space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {busy && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-brand-brown-dark/70">
                Reading text… {progress ? `${Math.round(progress.progress * 100)}%` : ""}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-brand-brown-dark/10">
                <div
                  className="h-full rounded-full bg-brand-blue-deep transition-all"
                  style={{ width: `${Math.round((progress?.progress ?? 0) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          {text && !busy && (
            <div className="space-y-4">
              <textarea
                readOnly
                value={text}
                rows={10}
                className="w-full rounded-2xl border border-brand-brown-dark/10 bg-white p-4 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              />
              <MagneticButton onClick={handleDownload}>Download .txt</MagneticButton>
            </div>
          )}
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
