"use client";

import { Check, Loader2, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let checkoutScriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScriptPromise) {
    checkoutScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT_SRC;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Couldn't load the payment form — check your connection and try again."));
      document.body.appendChild(script);
    });
  }
  return checkoutScriptPromise;
}

type Phase = "idle" | "processing" | "success" | "cancelled";

export function CheckoutButton({
  planKey,
  planLabel,
  children,
  className,
  variant = "solid",
}: {
  planKey: "PREMIUM" | "ENTERPRISE";
  planLabel: string;
  children: ReactNode;
  className?: string;
  variant?: "solid" | "outline" | "inverted";
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  // A successful `handler` fire always precedes Razorpay's own auto-close of
  // the modal, which also triggers `ondismiss` — this guards against that
  // from overwriting the success state with a false "cancelled" message.
  const succeededRef = useRef(false);

  async function handleClick() {
    setError(null);
    setPhase("idle");
    succeededRef.current = false;

    if (status !== "authenticated") {
      const callbackUrl = window.location.pathname + window.location.hash;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    setPhase("processing");
    try {
      const checkoutRes = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutData.error || "Couldn't start checkout.");

      await loadCheckoutScript();
      if (!window.Razorpay) throw new Error("Couldn't load the payment form.");

      const razorpay = new window.Razorpay({
        key: checkoutData.keyId,
        subscription_id: checkoutData.subscriptionId,
        name: "PDF Genie",
        description: `${planLabel} plan — billed monthly`,
        prefill: { name: session.user?.name ?? undefined, email: session.user?.email ?? undefined },
        theme: { color: "#1e3a8a" },
        handler: async (response: unknown) => {
          succeededRef.current = true;
          setPhase("success");
          const r = response as {
            razorpay_payment_id: string;
            razorpay_subscription_id: string;
            razorpay_signature: string;
          };
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(r),
            });
            if (!verifyRes.ok) throw new Error();
          } catch {
            // Not fatal — the webhook will reconcile the subscription within
            // seconds even if this optimistic confirmation call failed.
          } finally {
            // Give the "Payment successful" state a moment to actually be seen
            // before navigating away.
            setTimeout(() => router.push("/dashboard?upgraded=1"), 1200);
          }
        },
        modal: {
          ondismiss: () => {
            if (succeededRef.current) return;
            setPhase("cancelled");
          },
        },
      });
      razorpay.on("payment.failed", () => {
        setError("Payment failed — no charge was made. Please try again.");
        setPhase("idle");
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setPhase("idle");
    }
  }

  return (
    <div>
      <MagneticButton onClick={handleClick} disabled={phase === "processing" || phase === "success"} variant={variant} className={className}>
        {phase === "processing" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : phase === "success" ? (
          <>
            <Check size={16} />
            Activating your plan…
          </>
        ) : (
          children
        )}
      </MagneticButton>
      {phase === "cancelled" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-brown-dark/60">
          <X size={12} />
          Checkout cancelled — no charge was made.
        </p>
      )}
      {error && <p className="mt-2 text-xs font-medium text-status-danger">{error}</p>}
    </div>
  );
}
