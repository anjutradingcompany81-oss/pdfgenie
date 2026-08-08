"use client";

import { ScanLine, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { TabButton } from "@/components/tools/TabButton";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { imageToText, type OcrImageProgress } from "@/lib/image/image-to-text";
import { textToImage } from "@/lib/image/text-to-image";
import { downloadBlob } from "@/lib/pdf/download";

type Direction = "image-to-text" | "text-to-image";

export default function ImageTextPage() {
  const [direction, setDirection] = useState<Direction>("image-to-text");

  return (
    <ToolShell
      icon={ScanLine}
      title="Image & Text"
      description="Pull the text out of an image, or turn text into a shareable image."
    >
      <div className="mb-8 inline-flex rounded-full border border-brand-brown-dark/10 bg-white p-1">
        <TabButton active={direction === "image-to-text"} onClick={() => setDirection("image-to-text")}>
          Image → Text
        </TabButton>
        <TabButton active={direction === "text-to-image"} onClick={() => setDirection("text-to-image")}>
          Text → Image
        </TabButton>
      </div>

      {direction === "image-to-text" ? <ImageToText /> : <TextToImage />}

      <PrivacyNote />
    </ToolShell>
  );
}

function ImageToText() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useToolBusy();
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
    <div className="max-w-lg space-y-6">
      {!file && (
        <Dropzone accept="image/*" onFiles={handleFile} label="Drop an image here, or click to browse" />
      )}

      {file && (
        <>
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
        </>
      )}
    </div>
  );
}

function TextToImage() {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(28);
  const [textColor, setTextColor] = useState("#17130f");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!text.trim()) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    const id = setTimeout(() => {
      textToImage(text, { fontSize, textColor, backgroundColor, width: 640 }).then((blob) => {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      });
    }, 200);
    return () => clearTimeout(id);
  }, [text, fontSize, textColor, backgroundColor]);

  async function handleDownload() {
    if (!text.trim()) {
      setError("Type some text first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await textToImage(text, { fontSize, textColor, backgroundColor, width: 640 });
      downloadBlob(blob, "text-image.png");
    } catch {
      setError("Couldn't create that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Type or paste text here…"
        className="w-full rounded-2xl border border-brand-brown-dark/15 bg-white p-4 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="font-size" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
            Font size
          </label>
          <input
            id="font-size"
            type="number"
            min={12}
            max={72}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value) || 28)}
            className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-4 py-2.5 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="text-color" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
            Text color
          </label>
          <input
            id="text-color"
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="h-10 w-full rounded-full border border-brand-brown-dark/15 bg-white"
          />
        </div>
        <div>
          <label htmlFor="bg-color" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
            Background
          </label>
          <input
            id="bg-color"
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="h-10 w-full rounded-full border border-brand-brown-dark/15 bg-white"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-brown-dark/10 bg-white p-4">
        <canvas ref={previewRef} className="mx-auto max-w-full" />
      </div>

      {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

      <MagneticButton onClick={handleDownload} disabled={busy || !text.trim()}>
        {busy ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating…
          </>
        ) : (
          "Download PNG"
        )}
      </MagneticButton>
    </div>
  );
}
