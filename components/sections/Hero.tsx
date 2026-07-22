"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { fadeUp, staggerContainer } from "@/lib/motion";

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pt-28 pb-16 lg:px-10"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-[26rem] w-[26rem] rounded-full bg-brand-blue/25 blur-3xl motion-safe:animate-blob" />
        <div
          className="absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full bg-brand-brown/25 blur-3xl motion-safe:animate-blob"
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
          className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue-deep"
        >
          PDF tooling, reimagined
        </motion.p>

        <div className="overflow-hidden">
          <motion.h1
            variants={fadeUp}
            className="text-[13vw] font-bold leading-[0.92] tracking-tight text-brand-brown-dark sm:text-[9vw] lg:text-[6.2vw]"
          >
            Every PDF task,
          </motion.h1>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            variants={fadeUp}
            className="text-[13vw] font-bold leading-[0.92] tracking-tight text-brand-blue-deep sm:text-[9vw] lg:text-[6.2vw]"
          >
            one calm tool.
          </motion.h1>
        </div>

        <motion.p
          variants={fadeUp}
          className="mt-8 max-w-xl text-lg text-brand-brown-dark/70 sm:text-xl"
        >
          Merge, split, compress, convert, and sign PDFs in seconds — no
          installs, no watermarks, no waiting on a spinner.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-5">
          <MagneticButton href="/tools">Start for free</MagneticButton>
          <MagneticButton href="#how-it-works" variant="outline">
            See how it works
          </MagneticButton>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-brown-dark/50 sm:flex"
        initial={reduceMotion ? undefined : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
      >
        Scroll
        <motion.span
          className="h-8 w-px bg-brand-brown-dark/40"
          animate={reduceMotion ? undefined : { scaleY: [0, 1, 0] }}
          style={{ transformOrigin: "top" }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
