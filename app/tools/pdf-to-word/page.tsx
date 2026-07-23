"use client";

import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { pdfToWord } from "@/lib/pdf/word";
import { downloadBlob } from "@/lib/pdf/download";

export default function PdfToWordPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setFile(null);
    setError(null);
    setDone(false);
  }

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setDone(false);
  }

  async function handleConvert() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const buffer = await file.arrayBuffer();
      const blob = await pdfToWord(buffer);
      const baseName = file.name.replace(/\.pdf$/i, "");
      downloadBlob(blob, `${baseName}.docx`);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't read that PDF — it may be corrupted, scanned, or password-protected."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={FileDown}
      title="Convert PDF to Word"
      description="Turn a PDF into an editable .docx file."
    >
      {!file && (
        <Dropzone accept="application/pdf" onFiles={handleFile} label="Drop a PDF here, or click to browse" />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/50">
            Pulls the selectable text out in reading order and rebuilds it as paragraphs, with a
            page break between each original page. Fonts, tables, images, and multi-column
            layouts aren&apos;t reconstructed — for a scanned PDF with no selectable text, this
            won&apos;t find anything to convert.
          </p>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">.docx downloaded.</p>}

          <MagneticButton onClick={handleConvert} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Converting…
              </>
            ) : (
              "Convert to Word"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
