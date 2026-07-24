"use client";

import { Combine, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { mergePdfs } from "@/lib/pdf/merge";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";

type QueuedFile = { id: string; file: File };

export default function MergePage() {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(files: File[]) {
    setError(null);
    const next = files.map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
    }));
    setQueue((q) => [...q, ...next]);
  }

  function remove(id: string) {
    setQueue((q) => q.filter((item) => item.id !== id));
  }

  function move(index: number, direction: -1 | 1) {
    setQueue((q) => {
      const next = [...q];
      const target = index + direction;
      if (target < 0 || target >= next.length) return q;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleMerge() {
    if (queue.length < 2) {
      setError("Add at least two PDFs to merge.");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const buffers = await Promise.all(queue.map((q) => q.file.arrayBuffer()));
      const bytes = await mergePdfs(buffers);
      downloadBlob(bytesToBlob(bytes, "application/pdf"), "merged.pdf");
    } catch {
      setError(
        "Couldn't merge these files — make sure every file is a valid, unencrypted PDF."
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <ToolShell
      icon={Combine}
      title="Merge PDFs"
      description="Combine multiple PDFs into one document, in the order you choose."
    >
      <Dropzone
        accept="application/pdf"
        multiple
        onFiles={addFiles}
        label="Drop PDFs here, or click to browse"
        hint="You can add more files at any time"
      />

      {queue.length > 0 && (
        <div className="mt-6 space-y-3">
          {queue.map((item, i) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  data-hover="true"
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  aria-label="Move up"
                  className="flex h-6 w-6 items-center justify-center rounded text-brand-brown-dark/70 hover:text-brand-blue-deep disabled:opacity-20"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  data-hover="true"
                  disabled={i === queue.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label="Move down"
                  className="flex h-6 w-6 items-center justify-center rounded text-brand-brown-dark/70 hover:text-brand-blue-deep disabled:opacity-20"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <div className="flex-1">
                <FileChip
                  name={item.file.name}
                  size={item.file.size}
                  onRemove={() => remove(item.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm font-medium text-status-danger">{error}</p>}

      <div className="mt-8">
        <MagneticButton onClick={handleMerge} disabled={processing || queue.length < 2}>
          {processing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Merging…
            </>
          ) : (
            `Merge ${queue.length > 0 ? queue.length : ""} PDFs`.trim()
          )}
        </MagneticButton>
      </div>

      <PrivacyNote />
    </ToolShell>
  );
}
