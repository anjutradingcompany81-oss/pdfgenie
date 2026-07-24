"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { excelToPdf } from "@/lib/pdf/excel-to-pdf";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function ExcelToPdfPage() {
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
      const bytes = await excelToPdf(buffer);
      const baseName = file.name.replace(/\.(xlsx|xls|csv)$/i, "");
      downloadBlob(bytesToBlob(bytes, "application/pdf"), `${baseName}.pdf`);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that spreadsheet — it may be corrupted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={FileUp}
      title="Convert Excel to PDF"
      description="Turn a spreadsheet's first sheet into a PDF table."
    >
      {!file && (
        <Dropzone
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop an Excel or CSV file here, or click to browse"
        />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/50">
            Renders the first sheet as a simple grid table. Cell formatting, merged cells, and
            multiple sheets aren&apos;t preserved, and very long values are truncated to fit
            their column.
          </p>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">PDF downloaded.</p>}

          <MagneticButton onClick={handleConvert} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Converting…
              </>
            ) : (
              "Convert to PDF"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
