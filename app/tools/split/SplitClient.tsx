"use client";

import { Scissors, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { PdfThumbnailGrid } from "@/components/tools/PdfThumbnailGrid";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageCount } from "@/lib/pdf/pdfjs";
import { extractPages, parsePageRanges, splitEveryPage } from "@/lib/pdf/split";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [busy, setBusy] = useState<"extract" | "split" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    setFile(f);
    setSelected(new Set());
    setRangeInput("");
    try {
      const buf = await f.arrayBuffer();
      const count = await getPageCount(buf);
      setBuffer(buf);
      setPageCount(count);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
      setFile(null);
    }
  }

  function toggle(pageIndex: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) next.delete(pageIndex);
      else next.add(pageIndex);
      return next;
    });
    setRangeInput("");
  }

  function applyRange() {
    if (!rangeInput.trim()) return;
    setSelected(parsePageRanges(rangeInput, pageCount));
  }

  function reset() {
    setFile(null);
    setBuffer(null);
    setPageCount(0);
    setSelected(new Set());
    setRangeInput("");
    setError(null);
  }

  async function handleExtract() {
    if (!buffer || selected.size === 0) {
      setError("Select at least one page first.");
      return;
    }
    setBusy("extract");
    setError(null);
    try {
      const indices = [...selected].sort((a, b) => a - b);
      const bytes = await extractPages(buffer, indices);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "extracted.pdf");
    } catch {
      setError("Something went wrong extracting those pages.");
    } finally {
      setBusy(null);
    }
  }

  async function handleSplitAll() {
    if (!buffer || !file) return;
    setBusy("split");
    setError(null);
    try {
      const baseName = file.name.replace(/\.pdf$/i, "");
      const blob = await splitEveryPage(buffer, baseName);
      downloadBlob(blob, `${baseName}-pages.zip`);
    } catch {
      setError("Something went wrong splitting the pages.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ToolShell
      icon={Scissors}
      title="Split a PDF"
      description="Pull exact pages out of a PDF, or break it into one file per page."
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyRange()}
              placeholder="e.g. 1-3, 5, 8"
              className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark placeholder:text-brand-brown-dark/70 focus:border-brand-blue focus:outline-none sm:max-w-xs"
            />
            <button
              type="button"
              data-hover="true"
              onClick={applyRange}
              className="text-sm font-semibold text-brand-blue-deep hover:underline"
            >
              Select range
            </button>
            <span className="text-sm text-brand-brown-dark/70">
              {selected.size} of {pageCount} selected
            </span>
          </div>

          <PdfThumbnailGrid
            fileBuffer={buffer}
            pageCount={pageCount}
            selected={selected}
            onToggle={toggle}
          />

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          <div className="flex flex-wrap gap-4">
            <MagneticButton onClick={handleExtract} disabled={busy !== null}>
              {busy === "extract" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Extracting…
                </>
              ) : (
                "Extract selected pages"
              )}
            </MagneticButton>
            <MagneticButton variant="outline" onClick={handleSplitAll} disabled={busy !== null}>
              {busy === "split" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Splitting…
                </>
              ) : (
                "Split every page (.zip)"
              )}
            </MagneticButton>
          </div>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}
