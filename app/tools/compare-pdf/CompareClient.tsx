"use client";

import { FileDiff, Loader2, ChevronDown, Plus, Minus, FileText } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { comparePdfs, type PageComparison } from "@/lib/pdf/compare";

export default function ComparePdfPage() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PageComparison[] | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  async function handleCompare() {
    if (!fileA || !fileB) return;
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const [bufA, bufB] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);
      const comparison = await comparePdfs(bufA, bufB);
      setResults(comparison);
      setExpanded(new Set(comparison.filter((p) => p.status !== "same").map((p) => p.pageIndex)));
    } catch {
      setError("Couldn't compare those files — make sure both are valid, unencrypted PDFs.");
    } finally {
      setBusy(false);
    }
  }

  function toggle(pageIndex: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) next.delete(pageIndex);
      else next.add(pageIndex);
      return next;
    });
  }

  function reset() {
    setFileA(null);
    setFileB(null);
    setResults(null);
    setError(null);
    setExpanded(new Set());
  }

  const changedCount = results?.filter((p) => p.status !== "same").length ?? 0;

  return (
    <ToolShell
      icon={FileDiff}
      title="Compare PDFs"
      description="Upload two versions of a document and see exactly what changed, page by page."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold text-brand-brown-dark">Original</p>
          {!fileA ? (
            <Dropzone
              accept="application/pdf"
              onFiles={(files) => {
                setFileA(files[0] ?? null);
                setResults(null);
              }}
              label="Drop the original PDF"
            />
          ) : (
            <FileChip
              name={fileA.name}
              size={fileA.size}
              onRemove={() => {
                setFileA(null);
                setResults(null);
              }}
            />
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-brand-brown-dark">Revised</p>
          {!fileB ? (
            <Dropzone
              accept="application/pdf"
              onFiles={(files) => {
                setFileB(files[0] ?? null);
                setResults(null);
              }}
              label="Drop the revised PDF"
            />
          ) : (
            <FileChip
              name={fileB.name}
              size={fileB.size}
              onRemove={() => {
                setFileB(null);
                setResults(null);
              }}
            />
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-medium text-status-danger">{error}</p>}

      {fileA && fileB && !results && (
        <div className="mt-6">
          <MagneticButton onClick={handleCompare} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Comparing…
              </>
            ) : (
              "Compare PDFs"
            )}
          </MagneticButton>
        </div>
      )}

      {results && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-brown-dark/10 bg-brand-cream/50 p-4">
            <p className="text-sm text-brand-brown-dark">
              <span className="font-bold">{changedCount}</span> of{" "}
              <span className="font-bold">{results.length}</span>{" "}
              {results.length === 1 ? "page differs" : "pages differ"}
            </p>
            <button
              type="button"
              data-hover="true"
              onClick={reset}
              className="text-sm font-semibold text-brand-blue-deep hover:underline"
            >
              Compare different files
            </button>
          </div>

          <div className="space-y-3">
            {results.map((page) => (
              <PageDiffRow
                key={page.pageIndex}
                page={page}
                open={expanded.has(page.pageIndex)}
                onToggle={() => toggle(page.pageIndex)}
              />
            ))}
          </div>
        </div>
      )}

      <PrivacyNote />
    </ToolShell>
  );
}

function statusMeta(status: PageComparison["status"]) {
  switch (status) {
    case "same":
      return { label: "No changes", className: "text-brand-brown-dark/50 bg-brand-brown-dark/5" };
    case "changed":
      return { label: "Changed", className: "text-brand-blue-deep bg-brand-blue/10" };
    case "added":
      return { label: "Added", className: "text-emerald-700 bg-emerald-500/10" };
    case "removed":
      return { label: "Removed", className: "text-status-danger bg-status-danger/10" };
  }
}

function PageDiffRow({
  page,
  open,
  onToggle,
}: {
  page: PageComparison;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = statusMeta(page.status);

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-brown-dark/10 bg-white">
      <button
        type="button"
        data-hover="true"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="text-sm font-semibold text-brand-brown-dark">
            Page {page.pageIndex + 1}
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>
            {meta.label}
          </span>
        </span>
        {page.status !== "same" && (
          <ChevronDown
            size={16}
            className={`shrink-0 text-brand-brown-dark/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && page.status !== "same" && (
        <div className="border-t border-brand-brown-dark/10 px-5 py-4">
          {!page.hasText ? (
            <p className="flex items-center gap-2 text-sm text-brand-brown-dark/50">
              <FileText size={14} className="shrink-0" />
              No extractable text on this page — it may be a scan, and could still differ visually.
            </p>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-brand-brown-dark/80">
              {page.changes.map((change, i) =>
                change.added ? (
                  <span key={i} className="rounded bg-emerald-500/15 text-emerald-800">
                    <Plus size={10} className="mb-0.5 inline" strokeWidth={3} />
                    {change.value}
                  </span>
                ) : change.removed ? (
                  <span key={i} className="rounded bg-status-danger/15 text-status-danger line-through">
                    <Minus size={10} className="mb-0.5 inline" strokeWidth={3} />
                    {change.value}
                  </span>
                ) : (
                  <span key={i}>{change.value}</span>
                )
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
