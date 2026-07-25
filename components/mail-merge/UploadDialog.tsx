"use client";

import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { useModalA11y } from "@/components/ui/useModalA11y";

export function UploadDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(panelRef, open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-brown-dark/50 px-6 py-10">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-dialog-title"
        tabIndex={-1}
        className="surface-card w-full max-w-md rounded-3xl bg-white p-8 outline-none"
      >
        <div className="flex items-center justify-between">
          <h2 id="upload-dialog-title" className="text-lg font-bold text-brand-brown-dark">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-brand-brown-dark/70 hover:text-brand-brown-dark"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
