"use client";

import {
  Combine,
  Scissors,
  FileArchive,
  FileSignature,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { Reveal, StaggerItem, StaggerReveal } from "@/components/ui/Reveal";

const FEATURES = [
  {
    icon: Combine,
    title: "Merge",
    copy: "Drag in as many files as you need and combine them into one clean document, in the order you choose.",
    span: "lg:col-span-7",
    href: "/tools/merge",
  },
  {
    icon: Scissors,
    title: "Split",
    copy: "Pull exact pages or ranges out of any PDF without touching the rest of the file.",
    span: "lg:col-span-5",
    href: "/tools/split",
  },
  {
    icon: FileArchive,
    title: "Compress",
    copy: "Shrink file size by up to 90% while keeping text crisp and images readable.",
    span: "lg:col-span-5",
    href: "/tools/compress",
  },
  {
    icon: RefreshCw,
    title: "Convert",
    copy: "Turn PDF pages into crisp images, or combine images into a single PDF.",
    span: "lg:col-span-7",
    href: "/tools/convert",
  },
  {
    icon: FileSignature,
    title: "E-sign",
    copy: "Draw or type your signature and drop it exactly where you need it — no printer required.",
    span: "lg:col-span-6",
    href: "/tools/sign",
  },
  {
    icon: ShieldCheck,
    title: "Encrypt",
    copy: "Lock sensitive files behind a password and control who can edit or print.",
    span: "lg:col-span-6",
    href: "/tools/encrypt",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
            Everything, in one tool
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-6xl">
            Built for the PDF work you actually do.
          </h2>
        </Reveal>

        <StaggerReveal className="mt-16 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title} className={feature.span}>
              <FeatureCard {...feature} />
            </StaggerItem>
          ))}
        </StaggerReveal>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  copy,
  href,
}: {
  icon: typeof Combine;
  title: string;
  copy: string;
  href: string;
}) {
  return (
    <motion.a
      href={href}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      data-hover="true"
      className="group block h-full rounded-3xl border border-brand-brown-dark/10 bg-white p-8 shadow-[0_1px_0_0_rgba(0,0,0,0.03)] transition-colors duration-300 hover:border-brand-blue/30"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand-blue-deep group-hover:text-white">
        <Icon size={26} strokeWidth={2} />
      </div>
      <h3 className="mt-6 text-2xl font-bold text-brand-brown-dark">{title}</h3>
      <p className="mt-3 max-w-md text-brand-brown-dark/65">{copy}</p>
    </motion.a>
  );
}
