"use client";

import Link from "next/link";
import { ArrowLeft, Lock, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { TOOL_USED_EVENT } from "@/lib/tool-usage-client";

type ToolShellProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  /** Mail Merge has its own, more specific per-plan limits — it opts out of this generic gate. */
  skipUsageGate?: boolean;
};

type GateState = "checking" | "allowed" | "blocked";

export function ToolShell({ icon: Icon, title, description, children, skipUsageGate = false }: ToolShellProps) {
  const [gate, setGate] = useState<GateState>(skipUsageGate ? "allowed" : "checking");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (skipUsageGate) return;

    let cancelled = false;
    fetch("/api/usage/tool-status")
      .then((res) => res.json())
      .then((status: { unlimited: boolean; remaining: number; signedIn: boolean }) => {
        if (cancelled) return;
        setSignedIn(status.signedIn);
        setGate(!status.unlimited && status.remaining <= 0 ? "blocked" : "allowed");
      })
      .catch(() => {
        if (!cancelled) setGate("allowed");
      });

    function handleToolUsed(e: Event) {
      const status = (e as CustomEvent<{ unlimited: boolean; remaining: number; signedIn: boolean }>).detail;
      if (!status.unlimited && status.remaining <= 0) {
        setSignedIn(status.signedIn);
        setGate("blocked");
      }
    }
    window.addEventListener(TOOL_USED_EVENT, handleToolUsed);

    return () => {
      cancelled = true;
      window.removeEventListener(TOOL_USED_EVENT, handleToolUsed);
    };
  }, [skipUsageGate]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${title} — PDF Genie`,
    description,
    applicationCategory: "Utility",
    operatingSystem: "Any (Web-based)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl">
        <Link
          href="/tools"
          data-hover="true"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-brown-dark/70 transition-colors hover:text-brand-blue-deep"
        >
          <ArrowLeft size={16} />
          All tools
        </Link>

        <div className="mt-6 flex items-start gap-4">
          <div className="tool-shell-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep">
            <Icon size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl">
              {title}
            </h1>
            <p className="mt-2 max-w-xl text-brand-brown-dark/65">{description}</p>
          </div>
        </div>

        <div className="mt-10">
          {gate === "checking" ? (
            <div className="surface-card h-64 animate-pulse rounded-3xl border border-brand-brown-dark/10 bg-white" />
          ) : gate === "blocked" ? (
            <div className="surface-card rounded-3xl border border-brand-brown-dark/10 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep">
                <Lock size={24} />
              </div>
              <h2 className="mt-4 text-xl font-bold text-brand-brown-dark">You&apos;ve hit today&apos;s free limit</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-brand-brown-dark/70">
                {signedIn
                  ? "Free accounts get 10 tool uses a day. Upgrade to Pro or Team for unlimited use, every day."
                  : "Visitors get 3 free tool uses a day. Sign up for 10 a day free, or upgrade to Pro/Team for unlimited."}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CheckoutButton planKey="PREMIUM" planLabel="Pro">
                  Upgrade to Pro — ₹999/mo
                </CheckoutButton>
                <CheckoutButton planKey="ENTERPRISE" planLabel="Team" variant="outline">
                  Upgrade to Team — ₹2,999/mo
                </CheckoutButton>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
