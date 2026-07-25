"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { Reveal, StaggerItem, StaggerReveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { CheckoutButton } from "@/components/billing/CheckoutButton";

const TIERS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "10 tool uses a day, every tool.",
    features: ["10 tool uses / day", "Merge, split, compress & more", "Basic Mail Merge (30 emails/job)", "No credit card needed"],
    cta: "Continue with Free",
    highlighted: false,
    planKey: null,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/ month",
    description: "For people living in PDFs every day.",
    features: [
      "Unlimited tool use",
      "All tools, including e-sign",
      "Unlimited Mail Merge sending",
      "Priority conversion queue",
      "Password protection",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    planKey: "PREMIUM",
  },
  {
    name: "Team",
    price: "₹2,999",
    period: "/ month",
    description: "For departments that share workflows.",
    features: [
      "Everything in Pro",
      "5 seats included",
      "Shared templates",
      "Admin controls",
      "SSO on request",
    ],
    cta: "Upgrade to Team",
    highlighted: false,
    planKey: "ENTERPRISE",
  },
] as const;

export default function ChoosePlanPage() {
  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
            Welcome to PDF Genie
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl">
            Choose your plan
          </h1>
          <p className="mt-3 text-brand-brown-dark/65">
            Start free, or go unlimited from day one. You can change this anytime from your dashboard.
          </p>
        </Reveal>

        <StaggerReveal className="mt-14 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <StaggerItem key={tier.name}>
              <div
                className={`relative flex h-full flex-col rounded-3xl p-8 ${
                  tier.highlighted
                    ? "bg-brand-blue-deep text-white shadow-xl shadow-brand-blue-deep/20 lg:scale-105"
                    : "border border-brand-brown-dark/10 bg-white text-brand-brown-dark"
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-brown px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                    Most popular
                  </span>
                )}

                <h2 className="text-lg font-bold">{tier.name}</h2>
                <p className={`mt-2 text-sm ${tier.highlighted ? "text-white/70" : "text-brand-brown-dark/70"}`}>
                  {tier.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-bold">{tier.price}</span>
                  <span className={tier.highlighted ? "text-white/60" : "text-brand-brown-dark/70"}>{tier.period}</span>
                </div>

                <ul className="mt-8 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check size={18} className={`mt-0.5 shrink-0 ${tier.highlighted ? "text-brand-blue-light" : "text-brand-blue-deep"}`} />
                      <span className={tier.highlighted ? "text-white/85" : "text-brand-brown-dark/75"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  {tier.planKey ? (
                    <CheckoutButton
                      planKey={tier.planKey}
                      planLabel={tier.name}
                      variant={tier.highlighted ? "inverted" : "outline"}
                      className="w-full justify-center"
                    >
                      {tier.cta}
                    </CheckoutButton>
                  ) : (
                    <MagneticButton href="/dashboard" variant="outline" className="w-full justify-center">
                      {tier.cta}
                    </MagneticButton>
                  )}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerReveal>

        <p className="mt-10 text-center text-sm text-brand-brown-dark/60">
          Not ready to decide?{" "}
          <Link href="/dashboard" data-hover="true" className="font-semibold text-brand-blue-deep hover:underline">
            Skip for now
          </Link>
        </p>
      </div>
    </div>
  );
}
