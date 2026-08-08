"use client";

import { CheckCircle2, Download, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  TOOL_OUTPUT_RESET_EVENT,
  TOOL_PROGRESS_EVENT,
  TOOL_RESULT_EVENT,
  formatBytes,
  saveBlobToDisk,
  type ToolProgress,
  type ToolResultFile,
} from "@/lib/tools/tool-output";

/**
 * The shared tail of every tool: shows that work is running, then offers
 * whatever it produced. Rendered once by ToolShell so all tools behave the
 * same way without each having to build its own progress and download UI.
 */
export function ToolOutput() {
  const [progress, setProgress] = useState<ToolProgress>({ active: false });
  const [files, setFiles] = useState<ToolResultFile[]>([]);
  const urlsRef = useRef<ToolResultFile[]>([]);

  useEffect(() => {
    urlsRef.current = files;
  }, [files]);

  useEffect(() => {
    function onProgress(e: Event) {
      const detail = (e as CustomEvent<ToolProgress>).detail;
      if (!detail) return;
      setProgress(detail);
      // A fresh run supersedes whatever the last one produced.
      if (detail.active) setFiles([]);
    }

    function onResult(e: Event) {
      const detail = (e as CustomEvent<{ blob: Blob; filename: string }>).detail;
      if (!detail?.blob) return;
      setProgress({ active: false });
      setFiles((current) => [
        ...current,
        {
          id: `${detail.filename}-${Date.now()}-${current.length}`,
          blob: detail.blob,
          filename: detail.filename,
          size: detail.blob.size,
        },
      ]);
    }

    function onReset() {
      setFiles([]);
      setProgress({ active: false });
    }

    window.addEventListener(TOOL_PROGRESS_EVENT, onProgress);
    window.addEventListener(TOOL_RESULT_EVENT, onResult);
    window.addEventListener(TOOL_OUTPUT_RESET_EVENT, onReset);
    return () => {
      window.removeEventListener(TOOL_PROGRESS_EVENT, onProgress);
      window.removeEventListener(TOOL_RESULT_EVENT, onResult);
      window.removeEventListener(TOOL_OUTPUT_RESET_EVENT, onReset);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setFiles((current) => current.filter((f) => f.id !== id));
  }, []);

  const downloadAll = useCallback(() => {
    // Browsers throttle rapid successive saves, so stagger them slightly.
    files.forEach((f, i) => setTimeout(() => saveBlobToDisk(f.blob, f.filename), i * 250));
  }, [files]);

  if (!progress.active && files.length === 0) return null;

  return (
    <div className="mt-8" aria-live="polite">
      {progress.active && (
        <div className="surface-card rounded-2xl border border-brand-brown-dark/10 bg-white p-5">
          <div className="flex items-center gap-3">
            <Loader2 size={18} className="shrink-0 animate-spin text-brand-blue-deep" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-brown-dark">
                {progress.label || "Processing…"}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-blue/10">
                {typeof progress.percent === "number" ? (
                  <div
                    className="h-full rounded-full bg-brand-blue-deep transition-[width] duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
                  />
                ) : (
                  <div className="tool-progress-indeterminate h-full w-1/3 rounded-full bg-brand-blue-deep" />
                )}
              </div>
            </div>
            {typeof progress.percent === "number" && (
              <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-brown-dark/70">
                {Math.round(progress.percent)}%
              </span>
            )}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="surface-card rounded-2xl border border-brand-brown-dark/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-brown-dark">
              <CheckCircle2 size={18} className="shrink-0 text-status-success" />
              {files.length === 1 ? "Your file is ready" : `${files.length} files are ready`}
            </p>
            {files.length > 1 && (
              <button
                type="button"
                data-hover="true"
                onClick={downloadAll}
                className="inline-flex items-center gap-2 rounded-full border border-brand-blue-deep/25 px-4 py-2 text-sm font-semibold text-brand-blue-deep transition-colors hover:bg-brand-blue/10"
              >
                <Download size={15} />
                Download all
              </button>
            )}
          </div>

          <ul className="mt-4 space-y-2">
            {files.map((file) => (
              <li
                key={file.id}
                className="file-chip flex items-center gap-3 rounded-xl border border-brand-brown-dark/10 bg-brand-cream/40 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-brown-dark">{file.filename}</p>
                  <p className="text-xs text-brand-brown-dark/60">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  data-hover="true"
                  onClick={() => saveBlobToDisk(file.blob, file.filename)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-brand-blue to-brand-blue-deep px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Download size={15} />
                  Download
                </button>
                <button
                  type="button"
                  data-hover="true"
                  onClick={() => dismiss(file.id)}
                  aria-label={`Dismiss ${file.filename}`}
                  className="shrink-0 rounded-full p-1.5 text-brand-brown-dark/40 transition-colors hover:bg-brand-brown-dark/5 hover:text-brand-brown-dark"
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
