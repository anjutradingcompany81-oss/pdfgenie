"use client";

import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { TabButton } from "@/components/tools/TabButton";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { excelToPdf } from "@/lib/pdf/excel-to-pdf";
import { pdfToExcel } from "@/lib/pdf/pdf-to-excel";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

type Direction = "excel-to-pdf" | "pdf-to-excel";

export default function ConvertExcelPage() {
  const [direction, setDirection] = useState<Direction>("excel-to-pdf");

  return (
    <ToolShell
      icon={FileSpreadsheet}
      title="Convert Excel"
      description="Turn a spreadsheet into a PDF table, or pull a PDF's text into a spreadsheet."
    >
      <div className="mb-8 inline-flex rounded-full border border-brand-brown-dark/10 bg-white p-1">
        <TabButton active={direction === "excel-to-pdf"} onClick={() => setDirection("excel-to-pdf")}>
          Excel → PDF
        </TabButton>
        <TabButton active={direction === "pdf-to-excel"} onClick={() => setDirection("pdf-to-excel")}>
          PDF → Excel
        </TabButton>
      </div>

      {direction === "excel-to-pdf" ? <ExcelToPdf /> : <PdfToExcel />}

      <PrivacyNote />
    </ToolShell>
  );
}

function ExcelToPdf() {
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
    <div className="max-w-md space-y-6">
      {!file && (
        <Dropzone
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop an Excel or CSV file here, or click to browse"
        />
      )}

      {file && (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/70">
            Renders the first sheet as a simple grid table. Cell formatting, merged cells, and
            multiple sheets aren&apos;t preserved, and very long values are truncated to fit their
            column.
          </p>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
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
        </>
      )}
    </div>
  );
}

function PdfToExcel() {
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
        err instanceof Error ? err.message : "Couldn't read that PDF — it may be corrupted or password-protected."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={(files) => setFile(files[0] ?? null)}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/70">
            Puts each detected line of text into its own row, with the page number it came from.
            This doesn&apos;t detect table columns — for a scanned PDF with no selectable text,
            there&apos;s nothing to extract.
          </p>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
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
        </>
      )}
    </div>
  );
}
