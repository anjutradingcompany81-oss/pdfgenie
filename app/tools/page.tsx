import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { ToolSection } from "@/components/tools/ToolSection";
import { CORE_TOOLS, ORGANIZE_TOOLS, CONVERT_TOOLS, AUTOMATE_TOOLS } from "@/lib/tools-catalog";

export default function ToolsPage() {
  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
          All tools
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-6xl">
          What do you need to do?
        </h1>
        <p className="mt-4 max-w-xl text-brand-brown-dark/65">
          Every tool runs entirely in your browser — pick one below to get
          started.
        </p>

        <ToolSection eyebrow="Automate" title="Reach your whole list" tools={AUTOMATE_TOOLS} />
        <ToolSection eyebrow="Core tools" title="The essentials" tools={CORE_TOOLS} />
        <ToolSection eyebrow="Organize PDF" title="Rework a PDF's pages" tools={ORGANIZE_TOOLS} />
        <ToolSection eyebrow="Convert PDF" title="Move between formats" tools={CONVERT_TOOLS} />

        <PrivacyNote />
      </div>
    </div>
  );
}
