"use client";

import { Check, Sparkles, X } from "lucide-react";
import { useRef } from "react";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
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
  title = "Upgrade to PDF Genie Pro",
  message,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
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

        <div className="mt-5">
          <CheckoutButton planKey="PREMIUM" planLabel="Pro" className="w-full justify-center">
            Upgrade to Pro — ₹999/month
          </CheckoutButton>
        </div>

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
