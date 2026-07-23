"use client";

import { FileUp, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { wordToPdf } from "@/lib/pdf/word";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function WordToPdfPage() {
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
    <ToolShell
      icon={FileUp}
      title="Convert Word to PDF"
      description="Turn a .docx file into a PDF."
    >
      {!file && (
        <Dropzone
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onFiles={handleFile}
          label="Drop a .docx file here, or click to browse"
        />
      )}

      {file && (
        <div className="max-w-md space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <p className="text-xs text-brand-brown-dark/50">
            Pulls the document&apos;s text and paragraph breaks and lays them out as a clean PDF.
            Original fonts, tables, images, and complex formatting aren&apos;t preserved.
          </p>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
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
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
