"use client";

import { FileType, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { TabButton } from "@/components/tools/TabButton";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { extractText, textToPdf } from "@/lib/pdf/text";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

type Direction = "pdf-to-text" | "text-to-pdf";

export default function ConvertTextPage() {
  const [direction, setDirection] = useState<Direction>("pdf-to-text");

  return (
    <ToolShell
      icon={FileType}
      title="Convert Text"
      description="Pull the text out of a PDF, or turn plain text into a clean PDF."
    >
      <div className="mb-8 inline-flex rounded-full border border-brand-brown-dark/10 bg-white p-1">
        <TabButton active={direction === "pdf-to-text"} onClick={() => setDirection("pdf-to-text")}>
          PDF → Text
        </TabButton>
        <TabButton active={direction === "text-to-pdf"} onClick={() => setDirection("text-to-pdf")}>
          Text → PDF
        </TabButton>
      </div>

      {direction === "pdf-to-text" ? <PdfToText /> : <TextToPdf />}

      <PrivacyNote />
    </ToolShell>
  );
}

function PdfToText() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setText(null);
    setError(null);
  }

  async function handleExtract(f: File) {
    setBusy(true);
    setError(null);
    setText(null);
    try {
      const buffer = await f.arrayBuffer();
      const extracted = await extractText(buffer);
      setText(extracted.trim() || "(No selectable text found on this PDF.)");
    } catch {
      setError("Couldn't read that PDF — it may be corrupted, scanned, or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    handleExtract(f);
  }

  function handleDownload() {
    if (!text || !file) return;
    const baseName = file.name.replace(/\.pdf$/i, "");
    downloadBlob(new Blob([text], { type: "text/plain" }), `${baseName}.txt`);
  }

  return (
    <div className="space-y-6">
      {!file && (
        <Dropzone accept="application/pdf" onFiles={handleFile} label="Drop a PDF here, or click to browse" />
      )}

      {file && (
        <>
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {busy && (
            <p className="flex items-center gap-2 text-sm text-brand-brown-dark/70">
              <Loader2 size={16} className="animate-spin" />
              Extracting text…
            </p>
          )}

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          {text && !busy && (
            <>
              <textarea
                readOnly
                value={text}
                rows={12}
                className="w-full rounded-2xl border border-brand-brown-dark/15 bg-white px-5 py-4 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
              />
              <MagneticButton onClick={handleDownload}>Download .txt</MagneticButton>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TextToPdf() {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleConvert() {
    if (!text.trim()) {
      setError("Type or paste some text first.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const bytes = await textToPdf(text);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "document.pdf");
      setDone(true);
    } catch {
      setError("Something went wrong creating that PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="Type or paste your text here…"
        className="w-full rounded-2xl border border-brand-brown-dark/15 bg-white px-5 py-4 text-sm text-brand-brown-dark placeholder:text-brand-brown-dark/70 focus:border-brand-blue focus:outline-none"
      />

      {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
      {done && !error && <p className="text-sm font-medium text-brand-blue-deep">PDF downloaded.</p>}

      <MagneticButton onClick={handleConvert} disabled={busy || !text.trim()}>
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
  );
}
