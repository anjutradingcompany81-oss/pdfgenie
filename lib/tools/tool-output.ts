/**
 * Carries a tool's progress and its finished files from wherever the work
 * happens up to the shared output panel that ToolShell renders.
 *
 * Tools used to hand their result straight to a hidden anchor and click it,
 * so the browser started saving the moment processing ended, whether or not
 * the person was ready for it. Publishing the result instead lets the panel
 * offer the download, and gives somewhere to show that work is underway.
 *
 * A plain DOM event is the transport because tool clients are scattered
 * across ~30 independent pages that share no React tree above ToolShell.
 */

export const TOOL_PROGRESS_EVENT = "pdfgenie:tool-progress";
export const TOOL_RESULT_EVENT = "pdfgenie:tool-result";
export const TOOL_OUTPUT_RESET_EVENT = "pdfgenie:tool-output-reset";

export type ToolProgress = {
  /** Whether work is in flight. */
  active: boolean;
  /** What's happening right now, e.g. "Rebuilding tables". */
  label?: string;
  /** 0-100 when the work reports real progress; omit for an indeterminate bar. */
  percent?: number;
};

export type ToolResultFile = {
  id: string;
  blob: Blob;
  filename: string;
  size: number;
};

function emit(name: string, detail?: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

/** Announces that a tool started, finished, or moved through a step. */
export function publishToolProgress(progress: ToolProgress) {
  emit(TOOL_PROGRESS_EVENT, progress);
}

/** Announces a finished file, which the output panel offers for download. */
export function publishToolResult(blob: Blob, filename: string) {
  emit(TOOL_RESULT_EVENT, { blob, filename });
}

/** Clears any finished files — used when a tool's inputs change. */
export function resetToolOutput() {
  emit(TOOL_OUTPUT_RESET_EVENT);
}

/** Saves a blob to disk. The one place an actual download is triggered. */
export function saveBlobToDisk(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
