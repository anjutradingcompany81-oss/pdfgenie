"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="top"
      className="relative flex flex-col justify-center overflow-hidden px-6 pb-10 pt-28 lg:px-10 lg:pb-12 lg:pt-32"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-[18rem] w-[18rem] rounded-full bg-brand-blue/25 blur-3xl motion-safe:animate-blob" />
        <div
          className="absolute -right-24 top-1/3 h-[16rem] w-[16rem] rounded-full bg-brand-brown/25 blur-3xl motion-safe:animate-blob"
          style={{ animationDelay: "-6s" }}
        />
      </div>

      <motion.div
        className="mx-auto w-full max-w-7xl"
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "show"}
        variants={staggerContainer(0.15, 0.2)}
      >
        <motion.p
          variants={fadeUp}
          className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue-deep"
        >
          PDF tooling, reimagined
        </motion.p>

        <div className="overflow-hidden">
          <motion.h1
            variants={fadeUp}
            className="text-4xl font-bold leading-[0.98] tracking-tight text-brand-brown-dark sm:text-5xl lg:text-6xl"
          >
            Every PDF task,{" "}
            <span className="text-brand-blue-deep">one calm tool.</span>
          </motion.h1>
        </div>

        <motion.p
          variants={fadeUp}
          className="mt-5 max-w-xl text-base text-brand-brown-dark/70 sm:text-lg"
        >
          Merge, split, compress, convert, and sign PDFs in seconds — no
          installs, no watermarks, no waiting on a spinner.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-5">
          <MagneticButton href="/tools">Start for free</MagneticButton>
          <MagneticButton href="#how-it-works" variant="outline">
            See how it works
          </MagneticButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
