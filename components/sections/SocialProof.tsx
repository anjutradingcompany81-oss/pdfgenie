"use client";

import { Reveal, StaggerItem, StaggerReveal } from "@/components/ui/Reveal";
import { Marquee } from "@/components/ui/Marquee";

const LOGOS = [
  "Northwind",
  "Cascade Legal",
  "Bramble Studio",
  "Ferro & Co.",
  "Lumen Health",
  "Anchorpoint",
];

const TESTIMONIALS = [
  {
    quote:
      "We swapped four different PDF tools for this one. Our contracts team saves close to five hours a week.",
    name: "Priya Nandakumar",
    role: "Operations Lead, Cascade Legal",
  },
  {
    quote:
      "The compression is genuinely lossless-looking. Client decks that used to be 40MB now sit under 4.",
    name: "Marco Ferro",
    role: "Creative Director, Ferro & Co.",
  },
];

export function SocialProof() {
  return (
    <section className="px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-brown-dark/50">
            Trusted by teams who move fast
          </span>
        </Reveal>

        <div className="mt-10">
          <Marquee items={LOGOS} />
        </div>

        <StaggerReveal className="mt-20 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name}>
              <figure className="h-full rounded-3xl border border-brand-brown-dark/10 bg-white p-10">
                <blockquote className="text-xl font-semibold leading-relaxed text-brand-brown-dark sm:text-2xl">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 text-sm text-brand-brown-dark/60">
                  <span className="font-semibold text-brand-blue-deep">{t.name}</span>{" "}
                  — {t.role}
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
