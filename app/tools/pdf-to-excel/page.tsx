"use client";

import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { pdfToExcel } from "@/lib/pdf/pdf-to-excel";
import { downloadBlob } from "@/lib/pdf/download";

export default function PdfToExcelPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setFile(null);
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
      const blob = await pdfToExcel(buffer);
      const baseName = file.name.replace(/\.pdf$/i, "");
      downloadBlob(blob, `${baseName}.xlsx`);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't read that PDF — it may be corrupted or password-protected."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={FileSpreadsheet}
      title="Convert PDF to Excel"
      description="Pull a PDF's text into a spreadsheet."
    >
      {!file && (
        <Dropzone accept="application/pdf" onFiles={(files) => setFile(files[0] ?? null)} label="Drop a PDF here, or click to browse" />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/50">
            Puts each detected line of text into its own row, with the page number it came from.
            This doesn&apos;t detect table columns — for a scanned PDF with no selectable text,
            there&apos;s nothing to extract.
          </p>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">.xlsx downloaded.</p>}

          <MagneticButton onClick={handleConvert} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Converting…
              </>
            ) : (
              "Convert to Excel"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
