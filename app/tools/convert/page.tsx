"use client";

import { RefreshCw, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { pdfToImages, imagesToPdf } from "@/lib/pdf/convert";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

type Direction = "pdf-to-image" | "image-to-pdf";

export default function ConvertPage() {
  const [direction, setDirection] = useState<Direction>("pdf-to-image");

  return (
    <ToolShell
      icon={RefreshCw}
      title="Convert PDFs"
      description="Turn PDF pages into images, or combine images into a PDF."
    >
      <div className="mb-8 inline-flex rounded-full border border-brand-brown-dark/10 bg-white p-1">
        <TabButton
          active={direction === "pdf-to-image"}
          onClick={() => setDirection("pdf-to-image")}
        >
          PDF → Images
        </TabButton>
        <TabButton
          active={direction === "image-to-pdf"}
          onClick={() => setDirection("image-to-pdf")}
        >
          Images → PDF
        </TabButton>
      </div>

      {direction === "pdf-to-image" ? <PdfToImage /> : <ImageToPdf />}

      <PrivacyNote />
    </ToolShell>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-hover="true"
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-brand-blue-deep text-white" : "text-brand-brown-dark/60 hover:text-brand-brown-dark"
      }`}
    >
      {children}
    </button>
  );
}

function PdfToImage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<"png" | "jpeg">("png");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setError(null);
    setProgress(0);
  }

  async function handleConvert() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const baseName = file.name.replace(/\.pdf$/i, "");
      const blob = await pdfToImages(buffer, format, baseName, (done, total) =>
        setProgress(Math.round((done / total) * 100))
      );
      downloadBlob(blob, `${baseName}-images.zip`);
    } catch {
      setError("Couldn't convert that PDF — it may be corrupted or password-protected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
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

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-brand-brown-dark">Format</span>
            <div className="inline-flex rounded-full border border-brand-brown-dark/10 bg-white p-1">
              <TabButton active={format === "png"} onClick={() => setFormat("png")}>
                PNG
              </TabButton>
              <TabButton active={format === "jpeg"} onClick={() => setFormat("jpeg")}>
                JPG
              </TabButton>
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}

          <MagneticButton onClick={handleConvert} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Converting… {progress > 0 ? `${progress}%` : ""}
              </>
            ) : (
              "Convert to images"
            )}
          </MagneticButton>
        </>
      )}
    </div>
  );
}

function ImageToPdf() {
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
  );
}
