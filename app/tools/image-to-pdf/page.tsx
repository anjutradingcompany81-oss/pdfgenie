"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { imagesToPdf } from "@/lib/pdf/convert";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(newFiles: File[]) {
    setError(null);
    setFiles((prev) => [...prev, ...newFiles]);
  }

  function remove(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConvert() {
    if (files.length === 0) {
      setError("Add at least one image.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const bytes = await imagesToPdf(files);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "converted.pdf");
    } catch {
      setError("Couldn't convert those images — make sure they're valid PNG or JPG files.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={ImagePlus}
      title="Convert images to PDF"
      description="Combine one or more images into a single PDF, one page per image."
    >
      <div className="space-y-6">
        <Dropzone
          accept="image/png,image/jpeg"
          multiple
          onFiles={addFiles}
          label="Drop images here, or click to browse"
          hint="PNG or JPG — one PDF page per image"
        />

        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((file, i) => (
              <FileChip key={`${file.name}-${i}`} name={file.name} size={file.size} onRemove={() => remove(i)} />
            ))}
          </div>
        )}

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <MagneticButton onClick={handleConvert} disabled={busy || files.length === 0}>
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

      <PrivacyNote />
    </ToolShell>
  );
}
