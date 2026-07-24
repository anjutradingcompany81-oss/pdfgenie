import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { ToolSection } from "@/components/tools/ToolSection";
import { AUTOMATE_TOOLS, CORE_TOOLS, ORGANIZE_TOOLS, CONVERT_TOOLS } from "@/lib/tools-catalog";

export function ToolsShowcase() {
  return (
    <section id="features" className="px-6 py-16 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
            Everything, in one tool
          </span>
        </Reveal>

        <ToolSection
          eyebrow="Automate"
          title="Reach your whole list"
          tools={AUTOMATE_TOOLS}
          accent="from-fuchsia-500 to-pink-500"
          className="mt-6"
        />
        <ToolSection
          eyebrow="Core tools"
          title="The essentials"
          tools={CORE_TOOLS}
          accent="from-brand-blue to-brand-blue-deep"
        />
        <ToolSection
          eyebrow="Organize PDF"
          title="Rework a PDF's pages"
          tools={ORGANIZE_TOOLS}
          accent="from-amber-500 to-orange-500"
        />
        <ToolSection
          eyebrow="Convert PDF"
          title="Move between formats"
          tools={CONVERT_TOOLS}
          accent="from-emerald-500 to-teal-500"
        />

        <Reveal className="mt-10 flex justify-center">
          <Link
            href="/tools"
            data-hover="true"
            className="flex items-center gap-2 rounded-full border border-brand-brown-dark/15 px-6 py-3 text-sm font-semibold text-brand-brown-dark transition-colors hover:border-brand-blue/40"
          >
            View all tools
            <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
