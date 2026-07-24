"use client";

import { AudioLines, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { downloadBlob } from "@/lib/pdf/download";

function transcribe(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("audio", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/tools/audio-to-text");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200) resolve(data.text);
        else reject(new Error(data.error || "Transcription failed."));
      } catch {
        reject(new Error("Transcription failed."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.send(formData);
  });
}

export default function AudioToTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setText(null);
  }

  function reset() {
    setFile(null);
    setText(null);
    setError(null);
    setProgress(0);
  }

  async function handleTranscribe() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setText(null);
    setProgress(0);
    try {
      const result = await transcribe(file, setProgress);
      setText(result.trim() || "(No speech detected in that audio.)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't transcribe that audio.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  function handleDownload() {
    if (!text || !file) return;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    downloadBlob(new Blob([text], { type: "text/plain" }), `${baseName}.txt`);
  }

  return (
    <ToolShell
      icon={AudioLines}
      title="Audio to text"
      description="Transcribe speech from an audio file — runs on our own server, no third-party API."
    >
      {!file && (
        <Dropzone
          accept="audio/*"
          onFiles={handleFile}
          label="Drop an audio file here, or click to browse"
          hint="Up to 100MB"
        />
      )}

      {file && (
        <div className="max-w-lg space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {busy && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-brand-brown-dark/70">
                {progress < 100 ? `Uploading… ${progress}%` : "Transcribing on the server…"}
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

          {!text && (
            <MagneticButton onClick={handleTranscribe} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Working…
                </>
              ) : (
                "Transcribe"
              )}
            </MagneticButton>
          )}
        </div>
      )}

      <p className="mt-6 max-w-lg text-xs text-brand-brown-dark/70">
        Unlike other tools here, transcription needs real processing power — your audio is
        uploaded to our server, transcribed, then deleted immediately afterward.
      </p>
    </ToolShell>
  );
}
