"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { pdfToImages } from "@/lib/pdf/convert";
import { downloadBlob } from "@/lib/pdf/download";

type PdfToImageToolProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  format: "png" | "jpeg";
};

// Shared by /tools/pdf-to-jpg and /tools/pdf-to-png — same operation with a
// fixed output format, requested as two distinct tool pages.
export function PdfToImageTool({ icon, title, description, format }: PdfToImageToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setError(null);
    setProgress(0);
  }

  async function handleConvert() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const baseName = file.name.replace(/\.pdf$/i, "");
      const blob = await pdfToImages(buffer, format, baseName, (done, total) =>
        setProgress(Math.round((done / total) * 100))
      );
      downloadBlob(blob, `${baseName}-images.zip`);
    } catch {
      setError("Couldn't convert that PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell icon={icon} title={title} description={description}>
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <div className="space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <MagneticButton onClick={handleConvert} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Converting… {progress > 0 ? `${progress}%` : ""}
              </>
            ) : (
              `Convert to ${format === "png" ? "PNG" : "JPG"}`
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
