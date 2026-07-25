"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't cancel.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        data-hover="true"
        onClick={() => setConfirming(true)}
        className="text-xs font-semibold text-brand-brown-dark/70 hover:text-status-danger"
      >
        Cancel subscription
      </button>
    );
  }

  return (
    <div className="mt-1">
      <p className="text-xs text-brand-brown-dark/70">
        You&apos;ll keep access until the end of your current billing period. Cancel?
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          data-hover="true"
          disabled={busy}
          onClick={handleCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-status-danger"
        >
          {busy && <Loader2 size={12} className="animate-spin" />}
          Yes, cancel
        </button>
        <button
          type="button"
          data-hover="true"
          disabled={busy}
          onClick={() => setConfirming(false)}
          className="text-xs font-semibold text-brand-brown-dark/70"
        >
          Never mind
        </button>
      </div>
      {error && <p className="mt-1 text-xs font-medium text-status-danger">{error}</p>}
    </div>
  );
}
