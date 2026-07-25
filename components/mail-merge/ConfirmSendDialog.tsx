"use client";

import { Loader2, Mail, X } from "lucide-react";
import { useRef } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useModalA11y } from "@/components/ui/useModalA11y";

// Past this, the honest-scale note shows: real concurrent sending and real
// pause/resume, but driven from this open browser tab, not a background
// queue — see lib/mail-merge/job-registry.ts.
const LARGE_JOB_THRESHOLD = 500;

export function ConfirmSendDialog({
  open,
  recipientCount,
  starting,
  onConfirm,
  onClose,
}: {
  open: boolean;
  recipientCount: number;
  starting: boolean;
  onConfirm: () => void;
  onClose: () => void;
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
        aria-labelledby="confirm-send-title"
        tabIndex={-1}
        className="surface-card w-full max-w-md rounded-3xl bg-white p-8 outline-none"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep">
            <Mail size={22} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-brand-brown-dark/70 hover:text-brand-brown-dark"
          >
            <X size={20} />
          </button>
        </div>

        <h2 id="confirm-send-title" className="mt-4 text-2xl font-bold text-brand-brown-dark">
          Send this campaign?
        </h2>
        <p className="mt-2 text-sm text-brand-brown-dark/65">
          You&apos;re about to send {recipientCount} email{recipientCount === 1 ? "" : "s"}. You&apos;ll see live
          progress next, and can pause, resume, or cancel while it&apos;s running.
        </p>

        {recipientCount > LARGE_JOB_THRESHOLD && (
          <p className="mt-3 rounded-xl bg-brand-cream p-3 text-xs text-brand-brown-dark/70">
            This is a large job — sending happens in concurrent batches while this tab stays open, not
            through a background server queue. Keep this tab open until it finishes; if you close it early,
            reopen the job later and resume (or retry) to pick up where it left off.
          </p>
        )}

        <div className="mt-5">
          <MagneticButton onClick={onConfirm} disabled={starting} className="w-full justify-center">
            {starting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Starting…
              </>
            ) : (
              "Send now"
            )}
          </MagneticButton>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-sm font-semibold text-brand-brown-dark/70 hover:text-brand-brown-dark"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
