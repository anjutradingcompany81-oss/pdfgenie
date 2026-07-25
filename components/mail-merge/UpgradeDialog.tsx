"use client";

import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useModalA11y } from "@/components/ui/useModalA11y";

const PREMIUM_HIGHLIGHTS = [
  "Unlimited email sending",
  "Unlimited PDF attachments",
  "Outlook & Gmail integrations",
  "Scheduled campaigns",
  "Advanced analytics",
  "Priority support",
];

export function UpgradeDialog({
  open,
  onClose,
  title = "Upgrade to PDF Genie Premium",
  message,
  feature = "mail-merge",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  feature?: string;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(panelRef, open, onClose);

  if (!open) return null;

  async function handleNotifyMe() {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feature }),
      });
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-brown-dark/50 px-6 py-10">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-dialog-title"
        tabIndex={-1}
        className="surface-card w-full max-w-md rounded-3xl bg-white p-8 outline-none"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep">
            <Sparkles size={22} />
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

        <h2 id="upgrade-dialog-title" className="mt-4 text-2xl font-bold text-brand-brown-dark">{title}</h2>
        {message && <p className="mt-2 text-sm text-brand-brown-dark/65">{message}</p>}

        <p className="mt-4 text-sm font-semibold text-brand-brown-dark">Unlock:</p>
        <ul className="mt-2 space-y-1.5">
          {PREMIUM_HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-brand-brown-dark/75">
              <Check size={14} className="shrink-0 text-brand-blue-deep" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-2xl border border-dashed border-brand-brown-dark/20 bg-brand-cream px-4 py-3">
          <p className="text-sm font-semibold text-brand-brown-dark">Coming soon</p>
          <p className="mt-1 text-xs text-brand-brown-dark/70">
            Payment and subscription management will be available in a future release.
          </p>
        </div>

        {done ? (
          <p className="mt-4 text-sm font-medium text-brand-blue-deep">
            Thanks — we&apos;ll let you know when Premium is available.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="flex-1 rounded-full border border-brand-brown-dark/15 px-4 py-2.5 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
            />
            <MagneticButton onClick={handleNotifyMe} disabled={busy} className="shrink-0 px-6 py-2.5 text-xs">
              {busy ? <Loader2 size={14} className="animate-spin" /> : "Notify Me"}
            </MagneticButton>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-sm font-semibold text-brand-brown-dark/70 hover:text-brand-brown-dark"
        >
          Close
        </button>
      </div>
    </div>
  );
}
