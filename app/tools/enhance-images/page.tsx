"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { enhanceImage } from "@/lib/image/enhance-images";
import { downloadBlob } from "@/lib/pdf/download";

export default function EnhanceImagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [sharpen, setSharpen] = useState(false);
  const [busy, setBusy] = useState(false);
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
  }

  function reset() {
    setFile(null);
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setSharpen(false);
    setError(null);
    setDone(false);
  }

  async function handleEnhance() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const blob = await enhanceImage(file, { brightness, contrast, saturate, sharpen });
      const baseName = file.name.replace(/\.[^.]+$/, "");
      downloadBlob(blob, `${baseName}-enhanced.png`);
      setDone(true);
    } catch {
      setError("Something went wrong enhancing that image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={Sparkles}
      title="Enhance images"
      description="Adjust brightness, contrast, and saturation, with an optional sharpen pass."
    >
      {!file && (
        <Dropzone
          accept="image/*"
          onFiles={handleFile}
          label="Drop an image here, or click to browse"
        />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- live client-side filter preview of a user-selected file, next/image adds no value here
            <img
              src={previewUrl}
              alt=""
              className="max-h-64 w-full rounded-xl border border-brand-brown-dark/10 object-contain"
              style={{ filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)` }}
            />
          )}

          <div>
            <label htmlFor="brightness" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
              Brightness — {brightness}%
            </label>
            <input
              id="brightness"
              type="range"
              min={50}
              max={150}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-brand-blue-deep"
            />
          </div>

          <div>
            <label htmlFor="contrast" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
              Contrast — {contrast}%
            </label>
            <input
              id="contrast"
              type="range"
              min={50}
              max={150}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full accent-brand-blue-deep"
            />
          </div>

          <div>
            <label htmlFor="saturate" className="mb-2 block text-sm font-semibold text-brand-brown-dark">
              Saturation — {saturate}%
            </label>
            <input
              id="saturate"
              type="range"
              min={0}
              max={200}
              value={saturate}
              onChange={(e) => setSaturate(Number(e.target.value))}
              className="w-full accent-brand-blue-deep"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-brown-dark/70">
            <input
              type="checkbox"
              checked={sharpen}
              onChange={(e) => setSharpen(e.target.checked)}
              className="h-4 w-4 rounded border-brand-brown-dark/30 accent-brand-blue-deep"
            />
            Sharpen
          </label>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">Enhanced image downloaded.</p>}

          <MagneticButton onClick={handleEnhance} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enhancing…
              </>
            ) : (
              "Enhance & download"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
