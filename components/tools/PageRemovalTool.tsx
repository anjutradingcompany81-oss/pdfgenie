"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { PdfThumbnailGrid } from "@/components/tools/PdfThumbnailGrid";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageCount } from "@/lib/pdf/pdfjs";
import { removePages } from "@/lib/pdf/organize";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

type PageRemovalToolProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  selectionHint: string;
  actionLabel: string;
  actionLabelBusy: string;
  outputFileName: string;
};

// Backs /tools/delete-pages. Kept as its own component (rather than inlined)
// since it's a clean, reusable shape if another page-selection tool needs it.
export function PageRemovalTool({
  icon,
  title,
  description,
  selectionHint,
  actionLabel,
  actionLabelBusy,
  outputFileName,
}: PageRemovalToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    try {
      const buf = await f.arrayBuffer();
      const count = await getPageCount(buf);
      setFile(f);
      setBuffer(buf);
      setPageCount(count);
      setSelected(new Set());
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function toggle(pageIndex: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) next.delete(pageIndex);
      else next.add(pageIndex);
      return next;
    });
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setPageCount(0);
    setSelected(new Set());
    setError(null);
  }

  async function handleRemove() {
    if (!buffer) return;
    if (selected.size === 0) {
      setError(selectionHint);
      return;
    }
    if (selected.size === pageCount) {
      setError("Can't remove every page — at least one page has to remain.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const bytes = await removePages(buffer, [...selected]);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), outputFileName);
    } catch {
      setError("Something went wrong removing those pages.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell icon={icon} title={title} description={description}>
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

          <p className="text-sm text-brand-brown-dark/70">
            {selected.size} of {pageCount} pages selected
          </p>

          <PdfThumbnailGrid
            fileBuffer={buffer}
            pageCount={pageCount}
            selected={selected}
            onToggle={toggle}
          />

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <MagneticButton onClick={handleRemove} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {actionLabelBusy}
              </>
            ) : (
              actionLabel
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
