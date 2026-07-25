"use client";

import { FolderOpen } from "lucide-react";
import { useRef, type ChangeEvent } from "react";
import { Dropzone } from "@/components/tools/Dropzone";

/** Leaf filename for a file picked via a folder input — matching stays filename-only. */
export function attachmentLeafName(file: File): string {
  const relPath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (relPath) {
    const parts = relPath.split("/");
    return parts[parts.length - 1] || file.name;
  }
  return file.name;
}

export function AttachmentFolderPicker({ onFiles, hint }: { onFiles: (files: File[]) => void; hint?: string }) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const supportsFolderPicker =
    typeof document !== "undefined" && "webkitdirectory" in document.createElement("input");

  function handleFolderChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (files.length) onFiles(files);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      <Dropzone
        accept="application/pdf"
        multiple
        onFiles={onFiles}
        label="Drop PDFs here, or click to browse"
        hint={hint}
      />
      {supportsFolderPicker && (
        <>
          <button
            type="button"
            data-hover="true"
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue-deep hover:underline"
          >
            <FolderOpen size={13} />
            Or select a whole folder of PDFs
          </button>
          <input
            ref={folderInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={handleFolderChange}
            // Non-standard but universally supported directory-picker attributes —
            // not part of React's HTMLInputElement typings.
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
          />
        </>
      )}
    </div>
  );
}
