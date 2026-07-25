"use client";

import { FileArchive, PenTool, Scissors } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SearchTools } from "@/components/tools/SearchTools";
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

      {/* hero-grid becomes a 2-column layout only under [data-theme="preline"]
          (see globals.css) — hero-mockup stays in the DOM always so server
          and client markup never differ, just hidden by default via CSS. */}
      <div className="hero-grid mx-auto w-full max-w-7xl">
        <motion.div
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

          <motion.h1
            variants={fadeUp}
            className="max-w-2xl text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl"
          >
            Every PDF task, one calm tool
          </motion.h1>

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

        <div className="hero-mockup">
          <div className="hero-mockup-chrome">
            <span />
            <span />
            <span />
          </div>
          <div className="hero-mockup-body">
            <div className="hero-mockup-row">
              <span className="hero-mockup-icon hero-mockup-icon-a">
                <FileArchive size={15} />
              </span>
              <span className="hero-mockup-text">
                <span className="hero-mockup-t1">quarterly-report.pdf</span>
                <span className="hero-mockup-t2">Merging 4 files…</span>
              </span>
              <span className="hero-mockup-pct">92%</span>
            </div>
            <div className="hero-mockup-row">
              <span className="hero-mockup-icon hero-mockup-icon-b">
                <Scissors size={15} />
              </span>
              <span className="hero-mockup-text">
                <span className="hero-mockup-t1">client-deck.pdf</span>
                <span className="hero-mockup-t2">Compressed — 40MB → 3.8MB</span>
              </span>
              <span className="hero-mockup-pct">Done</span>
            </div>
            <div className="hero-mockup-row">
              <span className="hero-mockup-icon hero-mockup-icon-c">
                <PenTool size={15} />
              </span>
              <span className="hero-mockup-text">
                <span className="hero-mockup-t1">contract-v3.pdf</span>
                <span className="hero-mockup-t2">Awaiting signature</span>
              </span>
              <span className="hero-mockup-pct">Pending</span>
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={reduceMotion ? undefined : "hidden"}
        animate={reduceMotion ? undefined : "show"}
        variants={fadeUp}
        className="mx-auto mt-10 w-full max-w-2xl text-center lg:mt-14"
      >
        <SearchTools variant="light" size="lg" className="w-full" />
      </motion.div>
    </section>
  );
}
