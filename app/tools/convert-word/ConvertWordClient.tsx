"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { TabButton } from "@/components/tools/TabButton";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { wordToPdf, pdfToWord } from "@/lib/pdf/word";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

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
          }}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/70">
            Pulls the selectable text out in reading order and rebuilds it as paragraphs, with a
            page break between each original page. Fonts, tables, images, and multi-column layouts
            aren&apos;t reconstructed — for a scanned PDF with no selectable text, this won&apos;t
            find anything to convert.
          </p>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
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
        </>
      )}
    </div>
  );
}
