"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Cancellation & Refunds", href: "/refund-policy" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  return (
    <footer className="site-footer relative border-t border-brand-brown-dark/10 bg-brand-brown-dark/[0.025] px-6 pb-10 pt-20 text-brand-brown-dark lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 border-b border-brand-brown-dark/10 pb-16 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <span className="text-2xl font-bold">
              PDF<span className="text-brand-blue-deep">Genie</span>
            </span>
            <p className="mt-5 max-w-sm text-brand-brown-dark/60">
              The fastest way to merge, split, compress, convert, and sign
              PDFs — right in your browser.
            </p>
            <p className="mt-3 text-sm text-brand-brown-dark/60">
              Need help?{" "}
              <a href="mailto:anjutradingcompany81@gmail.com" data-hover="true" className="text-brand-brown-dark/85 underline hover:text-brand-blue-deep">
                anjutradingcompany81@gmail.com
              </a>
            </p>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md">
              <label htmlFor="newsletter-email" className="mb-2 block text-sm font-semibold text-brand-brown-dark/80">
                Get product updates
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-full border border-brand-brown-dark/15 bg-white px-5 py-3 text-sm text-brand-brown-dark placeholder:text-brand-brown-dark/40 focus:border-brand-blue focus:outline-none"
                />
                <MagneticButton type="submit" variant="solid" className="shrink-0 px-6 py-3 text-xs">
                  Subscribe
                </MagneticButton>
              </div>
              <p className="mt-3 text-xs text-brand-brown-dark/50" role="status">
                {submitted ? "Thanks — you're on the list." : ""}
              </p>
            </form>
          </Reveal>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col, i) => (
              <Reveal key={col.title} delay={i * 0.08}>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-brown-dark/50">
                  {col.title}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        data-hover="true"
                        className="text-sm text-brand-brown-dark/80 transition-colors hover:text-brand-blue-deep"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-sm text-brand-brown-dark/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} PDF Genie. All rights reserved.</p>
          <p>Made for people who hate broken PDFs.</p>
        </div>
      </div>
    </footer>
  );
}
