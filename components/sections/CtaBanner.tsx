"use client";

import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-brand-blue-deep px-6 py-28 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-brown/30 blur-3xl motion-safe:animate-blob"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/10 blur-3xl motion-safe:animate-blob"
        style={{ animationDelay: "-9s" }}
      />

      <Reveal className="relative mx-auto max-w-4xl text-center">
        <h2 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
          Stop fighting your PDFs.
          <br />
          Start finishing your day.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          Join thousands of teams who cut their document busywork down to
          minutes.
        </p>
        <div className="mt-10 flex justify-center">
          <MagneticButton href="/tools" variant="inverted">
            Get started — it&apos;s free
          </MagneticButton>
        </div>
      </Reveal>
    </section>
  );
}
