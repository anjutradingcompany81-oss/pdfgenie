"use client";

import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { extractText } from "@/lib/pdf/text";
import { downloadBlob } from "@/lib/pdf/download";

export default function PdfToTextPage() {
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
    <ToolShell
      icon={FileText}
      title="Convert PDF to text"
      description="Pull the selectable text out of a PDF into a plain .txt file."
    >
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && (
        <div className="space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {busy && (
            <p className="flex items-center gap-2 text-sm text-brand-brown-dark/60">
              <Loader2 size={16} className="animate-spin" />
              Extracting text…
            </p>
          )}

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

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
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
