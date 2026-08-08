"use client";

import { FileInput, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell, useToolBusy } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { getPageCount } from "@/lib/pdf/pdfjs";
import { insertPages, type InsertPosition } from "@/lib/pdf/organize";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

type Placement = "start" | "end" | "after";

export default function InsertPagesPage() {
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [basePageCount, setBasePageCount] = useState(0);
  const [insertFile, setInsertFile] = useState<File | null>(null);
  const [placement, setPlacement] = useState<Placement>("end");
  const [afterPage, setAfterPage] = useState(1);
  const [busy, setBusy] = useToolBusy();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleBaseFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    setDone(false);
    try {
      const count = await getPageCount(await f.arrayBuffer());
      setBaseFile(f);
      setBasePageCount(count);
      setAfterPage(count);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted or password-protected.");
    }
  }

  function reset() {
    setBaseFile(null);
    setBasePageCount(0);
    setInsertFile(null);
    setPlacement("end");
    setAfterPage(1);
    setError(null);
    setDone(false);
  }

  async function handleInsert() {
    if (!baseFile || !insertFile) {
      setError("Add both the base PDF and the PDF you want to insert.");
      return;
    }
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const baseBuffer = await baseFile.arrayBuffer();
      const insertBuffer = await insertFile.arrayBuffer();
      const position: InsertPosition =
        placement === "start" ? "start" : placement === "end" ? "end" : { after: afterPage - 1 };
      const bytes = await insertPages(baseBuffer, insertBuffer, position);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "merged-with-inserted-pages.pdf");
      setDone(true);
    } catch {
      setError("Couldn't insert those pages — make sure both files are valid, unencrypted PDFs.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell
      icon={FileInput}
      title="Insert pages into a PDF"
      description="Drop the pages of one PDF into another, exactly where you want them."
    >
      <div className="space-y-8">
        <div>
          <p className="mb-3 text-sm font-semibold text-brand-brown-dark">1. Base PDF</p>
          {!baseFile && (
            <Dropzone
              accept="application/pdf"
              onFiles={handleBaseFile}
              label="Drop the base PDF here, or click to browse"
            />
          )}
          {baseFile && <FileChip name={baseFile.name} size={baseFile.size} onRemove={reset} />}
        </div>

        {baseFile && (
          <div>
            <p className="mb-3 text-sm font-semibold text-brand-brown-dark">
              2. PDF to insert
            </p>
            {!insertFile && (
              <Dropzone
                accept="application/pdf"
                onFiles={(files) => setInsertFile(files[0] ?? null)}
                label="Drop the PDF you want to insert, or click to browse"
              />
            )}
            {insertFile && (
              <FileChip
                name={insertFile.name}
                size={insertFile.size}
                onRemove={() => setInsertFile(null)}
              />
            )}
          </div>
        )}

        {baseFile && insertFile && (
          <div>
            <p className="mb-3 text-sm font-semibold text-brand-brown-dark">3. Where?</p>
            <div className="flex flex-wrap items-center gap-3">
              <PlacementButton
                active={placement === "start"}
                onClick={() => setPlacement("start")}
              >
                At the start
              </PlacementButton>
              <PlacementButton active={placement === "end"} onClick={() => setPlacement("end")}>
                At the end
              </PlacementButton>
              <PlacementButton
                active={placement === "after"}
                onClick={() => setPlacement("after")}
              >
                After page…
              </PlacementButton>
              {placement === "after" && (
                <input
                  type="number"
                  min={1}
                  max={basePageCount}
                  value={afterPage}
                  onChange={(e) =>
                    setAfterPage(
                      Math.min(basePageCount, Math.max(1, Number(e.target.value) || 1))
                    )
                  }
                  className="w-20 rounded-full border border-brand-brown-dark/15 bg-white px-4 py-2 text-sm text-brand-brown-dark focus:border-brand-blue focus:outline-none"
                />
              )}
              {placement === "after" && (
                <span className="text-sm text-brand-brown-dark/70">of {basePageCount}</span>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-sm font-medium text-status-danger">{error}</p>}
        {done && !error && (
          <p className="text-sm font-medium text-brand-blue-deep">
            Done — your merged PDF downloaded.
          </p>
        )}

        {baseFile && insertFile && (
          <MagneticButton onClick={handleInsert} disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Inserting…
              </>
            ) : (
              "Insert pages"
            )}
          </MagneticButton>
        )}
      </div>

      <PrivacyNote />
    </ToolShell>
  );
}

function PlacementButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      data-hover="true"
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-brand-blue bg-brand-blue/5 text-brand-blue-deep"
          : "border-brand-brown-dark/10 text-brand-brown-dark/70 hover:border-brand-blue/30"
      }`}
    >
      {children}
    </button>
  );
}
