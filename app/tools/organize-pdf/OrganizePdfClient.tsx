"use client";

import { LayoutGrid, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { PageOrganizerGrid, type OrganizerPage } from "@/components/tools/PageOrganizerGrid";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageCount } from "@/lib/pdf/pdfjs";
import { reorganizePdf } from "@/lib/pdf/reorganize";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function OrganizePdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<OrganizerPage[]>([]);
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
      setPages(
        Array.from({ length: count }, (_, i) => ({
          id: `${i}`,
          originalIndex: i,
          rotation: 0,
        }))
      );
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setPages([]);
    setError(null);
  }

  async function handleSave() {
    if (!buffer) return;
    if (pages.length === 0) {
      setError("At least one page has to remain.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const bytes = await reorganizePdf(buffer, pages);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "organized.pdf");
    } catch {
      setError("Something went wrong organizing that PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={LayoutGrid}
      title="Organize PDF"
      description="Drag pages to reorder them, rotate or delete any page, then save the result."
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

          <p className="text-sm text-brand-brown-dark/70">
            {pages.length} page{pages.length === 1 ? "" : "s"} — drag to reorder, hover a page for
            rotate/delete.
          </p>

          <PageOrganizerGrid fileBuffer={buffer} pages={pages} onChange={setPages} />

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <MagneticButton onClick={handleSave} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save & download"
            )}
          </MagneticButton>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
