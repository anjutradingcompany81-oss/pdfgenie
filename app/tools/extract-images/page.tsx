"use client";

import { Images, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { extractImages } from "@/lib/pdf/extract-images";
import { downloadBlob } from "@/lib/pdf/download";

export default function ExtractImagesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ extracted: number; skipped: number } | null>(null);

  function reset() {
    setFile(null);
    setError(null);
    setResult(null);
  }

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setResult(null);
  }

  async function handleExtract() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const { zipBlob, extractedCount, skippedCount } = await extractImages(buffer);
      if (!zipBlob) {
        setError(
          skippedCount > 0
            ? "Found images on this PDF, but none used an encoding we support extracting yet."
            : "No embedded images found on this PDF."
        );
        return;
      }
      const baseName = file.name.replace(/\.pdf$/i, "");
      downloadBlob(zipBlob, `${baseName}-images.zip`);
      setResult({ extracted: extractedCount, skipped: skippedCount });
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or encrypted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={Images}
      title="Extract images from a PDF"
      description="Pull every embedded image out of a PDF as separate files."
    >
      {!file && (
        <Dropzone accept="application/pdf" onFiles={handleFile} label="Drop a PDF here, or click to browse" />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/50">
            Supports JPEG images and standard 8-bit grayscale/RGB/CMYK images. Indexed-color,
            JPEG2000, and CCITT fax-encoded (typical for scanned black-and-white pages) images
            aren&apos;t supported yet and will be skipped rather than extracted incorrectly.
          </p>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {result && !error && (
            <p className="text-sm font-medium text-brand-blue-deep">
              {result.extracted} image{result.extracted === 1 ? "" : "s"} downloaded as a .zip
              {result.skipped > 0
                ? ` (${result.skipped} skipped — unsupported encoding).`
                : "."}
            </p>
          )}

          <MagneticButton onClick={handleExtract} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Extracting…
              </>
            ) : (
              "Extract images"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
