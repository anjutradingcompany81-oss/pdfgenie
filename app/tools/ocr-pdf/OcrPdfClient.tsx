"use client";

import { ScanText, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ocrPdf, type OcrProgress } from "@/lib/pdf/ocr";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function OcrPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState<OcrProgress | null>(null);

  function reset() {
    setFile(null);
    setError(null);
    setDone(false);
    setProgress(null);
  }

  async function handleOcr() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDone(false);
    setProgress(null);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = await ocrPdf(buffer, setProgress);
      const baseName = file.name.replace(/\.pdf$/i, "");
      downloadBlob(bytesToBlob(bytes, "application/pdf"), `${baseName}-searchable.pdf`);
      setDone(true);
    } catch {
      setError("Couldn't run OCR on that PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <ToolShell
      icon={ScanText}
      title="OCR a PDF"
      description="Turn a scanned PDF into a searchable one with selectable text."
    >
      {!file && (
        <Dropzone accept="application/pdf" onFiles={(files) => setFile(files[0] ?? null)} label="Drop a PDF here, or click to browse" />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/70">
            Recognizes text on every page and rebuilds the PDF with an invisible, searchable
            text layer behind the original page image. The first run downloads the recognition
            engine (~15MB) — after that it&apos;s cached. Larger PDFs take longer, roughly a
            few seconds per page.
          </p>

          {busy && progress && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-brand-brown-dark/70">
                Page {progress.page} of {progress.totalPages} — {progress.status}
              </p>
              <div className="h-1.5 overflow-hidden rounded-full bg-brand-brown-dark/10">
                <div
                  className="h-full rounded-full bg-brand-blue-deep transition-all"
                  style={{
                    width: `${Math.round(
                      ((progress.page - 1 + progress.progress) / progress.totalPages) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && (
            <p className="text-sm font-medium text-brand-blue-deep">Searchable PDF downloaded.</p>
          )}

          <MagneticButton onClick={handleOcr} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Running OCR…
              </>
            ) : (
              "Run OCR"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
