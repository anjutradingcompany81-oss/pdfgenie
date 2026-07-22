"use client";

import { motion } from "framer-motion";
import { Reveal, StaggerItem, StaggerReveal } from "@/components/ui/Reveal";

const STEPS = [
  {
    number: "01",
    title: "Drop your files",
    copy: "Drag PDFs, images, or Office docs into the workspace — or import from Drive and Dropbox.",
  },
  {
    number: "02",
    title: "Pick an action",
    copy: "Merge, split, compress, convert, or sign. Chain multiple actions into one workflow.",
  },
  {
    number: "03",
    title: "Preview instantly",
    copy: "See exactly how the output will look before you commit — page by page.",
  },
  {
    number: "04",
    title: "Export & share",
    copy: "Download the result or send a shareable link. Nothing sits on our servers longer than an hour.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-brand-brown-dark/[0.03] px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
            How it works
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-6xl">
            Four steps. Zero learning curve.
          </h2>
        </Reveal>

        <StaggerReveal
          stagger={0.15}
          className="relative mt-20 grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-brand-blue/0 via-brand-blue/40 to-brand-brown/0 lg:block"
          />

          {STEPS.map((step, i) => (
            <StaggerItem key={step.number} className="relative">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-brand-blue-deep bg-brand-cream text-lg font-bold text-brand-blue-deep">
                <motion.span
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
                >
                  {step.number}
                </motion.span>
              </div>
              <h3 className="mt-6 text-xl font-bold text-brand-brown-dark">
                {step.title}
              </h3>
              <p className="mt-3 text-brand-brown-dark/65">{step.copy}</p>
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}
