import { recordToolUsage } from "@/lib/tool-usage-client";
import { publishToolResult, saveBlobToDisk } from "@/lib/tools/tool-output";

/**
 * Hands a finished file to the shared output panel rather than saving it
 * immediately. Every tool already called this at the end of its work, so
 * routing it here is what turns an automatic download into an offered one
 * across all of them at once.
 *
 * Use `saveBlobToDisk` for the actual save — that's what the panel's
 * Download button calls.
 */
export function downloadBlob(blob: Blob, filename: string) {
  publishToolResult(blob, filename);
  recordToolUsage();
}

export { saveBlobToDisk };

export function bytesToBlob(bytes: Uint8Array, type: string): Blob {
  return new Blob([new Uint8Array(bytes)], { type });
}
