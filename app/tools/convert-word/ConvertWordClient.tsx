"use client";

import { FileUp, Loader2, Info } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { TabButton } from "@/components/tools/TabButton";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { wordToPdf, pdfToWord } from "@/lib/pdf/word";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";
import {
  convertPdfViaApi,
  PasswordRequiredError,
  ProviderNotConfiguredError,
  STAGE_LABELS,
  type ConversionUiStage,
} from "@/lib/pdf-conversion-client";

type Direction = "word-to-pdf" | "pdf-to-word";

export default function ConvertWordPage() {
  const [direction, setDirection] = useState<Direction>("word-to-pdf");

  return (
    <ToolShell
      icon={FileUp}
      title="Convert Word"
      description="Turn a .docx file into a PDF, or a PDF into an editable .docx file."
    >
      <div className="mb-8 inline-flex rounded-full border border-brand-brown-dark/10 bg-white p-1">
        <TabButton active={direction === "word-to-pdf"} onClick={() => setDirection("word-to-pdf")}>
          Word → PDF
        </TabButton>
        <TabButton active={direction === "pdf-to-word"} onClick={() => setDirection("pdf-to-word")}>
          PDF → Word
        </TabButton>
      </div>

      {direction === "word-to-pdf" ? <WordToPdf /> : <PdfToWord />}

      <PrivacyNote />
    </ToolShell>
  );
}

function WordToPdf() {
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
    if (/\.doc$/i.test(f.name)) {
      setFile(f);
      setError(
        "Legacy .doc files aren't supported — only .docx. Open it in Word (or Google Docs) and save/export as .docx, then try again."
      );
      setDone(false);
      return;
    }
    setFile(f);
    setError(null);
    setDone(false);
  }

  async function handleConvert() {
    if (!file) return;
    if (/\.doc$/i.test(file.name)) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = await wordToPdf(buffer);
      const baseName = file.name.replace(/\.docx$/i, "");
      downloadBlob(bytesToBlob(bytes, "application/pdf"), `${baseName}.pdf`);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that document — it may be corrupted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      {!file && (
        <Dropzone
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onFiles={handleFile}
          label="Drop a .docx file here, or click to browse"
        />
      )}

      {file && (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/70">
            Pulls the document&apos;s text and paragraph breaks and lays them out as a clean PDF.
            Original fonts, tables, images, and complex formatting aren&apos;t preserved.
          </p>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">PDF downloaded.</p>}

          <MagneticButton onClick={handleConvert} disabled={busy || /\.doc$/i.test(file.name)}>
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

function PdfToWord() {
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
        blob = await convertPdfViaApi(file, "docx", needsPassword ? password : undefined, setStage);
      } catch (err) {
        if (err instanceof ProviderNotConfiguredError) {
          // Professional conversion isn't configured yet — fall back to the
          // existing client-side (text-only) conversion so the tool keeps
          // working rather than breaking outright.
          setStage("converting");
          const buffer = await file.arrayBuffer();
          blob = await pdfToWord(buffer);
        } else {
          throw err;
        }
      }
      const baseName = file.name.replace(/\.pdf$/i, "");
      downloadBlob(blob, `${baseName}.docx`);
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
            const f = files[0];
            if (!f) return;
            setFile(f);
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
              Unlike most tools here, this one uses a professional conversion service to preserve
              fonts, tables, and images — your PDF is sent securely for conversion and the file is
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
          {done && !error && <p className="text-sm font-medium text-brand-blue-deep">.docx downloaded.</p>}

          <MagneticButton onClick={handleConvert} disabled={busy || (needsPassword && !password)}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {STAGE_LABELS[stage] || "Converting…"}
              </>
            ) : (
              "Convert to Word"
            )}
          </MagneticButton>
        </>
      )}
    </div>
  );
}
