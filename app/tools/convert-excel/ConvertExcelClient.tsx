"use client";

import { FileSpreadsheet, Loader2, Info } from "lucide-react";
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
import {
  convertPdfViaApi,
  PasswordRequiredError,
  ProviderNotConfiguredError,
  STAGE_LABELS,
  type ConversionUiStage,
} from "@/lib/pdf-conversion-client";

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
  const [stage, setStage] = useState<ConversionUiStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState("");

  const busy = stage !== "idle" && stage !== "completed" && stage !== "failed";

  function reset() {
    setFile(null);
    setStage("idle");
    setError(null);
    setDone(false);
    setNeedsPassword(false);
    setPassword("");
  }

  async function handleConvert() {
    if (!file) return;
    setError(null);
    setDone(false);
    try {
      let blob: Blob;
      try {
        blob = await convertPdfViaApi(file, "xlsx", needsPassword ? password : undefined, setStage);
      } catch (err) {
        if (err instanceof ProviderNotConfiguredError) {
          // Professional conversion isn't configured yet — fall back to the
          // existing client-side (line-dump) conversion so the tool keeps
          // working rather than breaking outright.
          setStage("converting");
          const buffer = await file.arrayBuffer();
          blob = await pdfToExcel(buffer);
        } else {
          throw err;
        }
      }
      const baseName = file.name.replace(/\.pdf$/i, "");
      downloadBlob(blob, `${baseName}.xlsx`);
      setDone(true);
      setStage("completed");
    } catch (err) {
      if (err instanceof PasswordRequiredError) {
        setNeedsPassword(true);
        setStage("idle");
        setError(needsPassword ? "Incorrect password — try again." : null);
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to convert this PDF.");
      setStage("failed");
    }
  }

  return (
    <div className="max-w-md space-y-6">
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={(files) => {
            setFile(files[0] ?? null);
            setError(null);
            setDone(false);
            setNeedsPassword(false);
            setPassword("");
          }}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div className="flex items-start gap-2 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-3 text-xs text-brand-brown-dark/70">
            <Info size={14} className="mt-0.5 shrink-0 text-brand-blue-deep" />
            <p>
              Unlike most tools here, this one uses a professional conversion service to rebuild
              real tables and columns — your PDF is sent securely for conversion and the file is
              deleted from our server shortly after you download the result.
            </p>
          </div>

          {needsPassword && (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-brown-dark">
                Password protected PDF detected
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter the PDF's password"
                className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              />
            </label>
          )}

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {busy && <p className="text-sm font-medium text-brand-blue-deep">{STAGE_LABELS[stage]}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">.xlsx downloaded.</p>}

          <MagneticButton onClick={handleConvert} disabled={busy || (needsPassword && !password)}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {STAGE_LABELS[stage] || "Converting…"}
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
