"use client";

import { Crop, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { BoxSelector, type RatioBox } from "@/components/tools/BoxSelector";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageSize, renderPageToCanvas } from "@/lib/pdf/pdfjs";
import { cropPdf } from "@/lib/pdf/crop";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

const PREVIEW_WIDTH = 640;
const DEFAULT_BOX: RatioBox = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };

export default function CropPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageSizePt, setPageSizePt] = useState({ width: 0, height: 0 });
  const [box, setBox] = useState<RatioBox>(DEFAULT_BOX);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasHost = useRef<HTMLDivElement>(null);
  const previewHeight = pageSizePt.width ? pageSizePt.height * (PREVIEW_WIDTH / pageSizePt.width) : 0;

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    try {
      const buf = await f.arrayBuffer();
      const size = await getPageSize(buf, 1);
      setFile(f);
      setBuffer(buf);
      setPageSizePt(size);
      setBox(DEFAULT_BOX);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setError(null);
  }

  useEffect(() => {
    if (!buffer || !pageSizePt.width || !canvasHost.current) return;
    let cancelled = false;
    const scale = PREVIEW_WIDTH / pageSizePt.width;
    renderPageToCanvas(buffer, 1, scale).then((canvas) => {
      if (cancelled || !canvasHost.current) return;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      canvasHost.current.replaceChildren(canvas);
    });
    return () => {
      cancelled = true;
    };
  }, [buffer, pageSizePt.width]);

  async function handleCrop() {
    if (!buffer) return;
    setBusy(true);
    setError(null);
    try {
      const bytes = await cropPdf(buffer, box);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "cropped.pdf");
    } catch {
      setError("Something went wrong cropping that PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={Crop}
      title="Crop a PDF"
      description="Drag the selection to the area you want to keep — the same crop is applied to every page."
    >
      {!file && (
        <Dropzone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop a PDF here, or click to browse"
        />
      )}

      {file && buffer && (
        <div className="space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          <div
            className="relative mx-auto overflow-hidden rounded-xl border border-brand-brown-dark/10 bg-white shadow-sm"
            style={{ width: PREVIEW_WIDTH, maxWidth: "100%", aspectRatio: pageSizePt.width ? `${pageSizePt.width} / ${pageSizePt.height}` : undefined }}
          >
            <div ref={canvasHost} className="absolute inset-0" />
            <BoxSelector
              box={box}
              onChange={setBox}
              containerSize={{ width: PREVIEW_WIDTH, height: previewHeight }}
            />
          </div>

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <MagneticButton onClick={handleCrop} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Cropping…
              </>
            ) : (
              "Crop & download"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
