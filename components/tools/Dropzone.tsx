"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent, type ChangeEvent } from "react";

type DropzoneProps = {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
};

export function Dropzone({
  accept,
  multiple = false,
  onFiles,
  label = "Drop files here, or click to browse",
  hint,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(multiple ? files : [files[0]]);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(multiple ? files : [files[0]]);
    e.target.value = "";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      data-hover="true"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-16 text-center transition-colors duration-200 ${
        dragging
          ? "border-brand-blue bg-brand-blue/5"
          : "border-brand-brown-dark/20 bg-white hover:border-brand-blue/40"
      }`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep">
        <UploadCloud size={28} />
      </div>
      <div>
        <p className="text-lg font-semibold text-brand-brown-dark">{label}</p>
        {hint && <p className="mt-1 text-sm text-brand-brown-dark/70">{hint}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
}
