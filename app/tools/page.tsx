import type { Metadata } from "next";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { ToolSection } from "@/components/tools/ToolSection";
import { CORE_TOOLS, ORGANIZE_TOOLS, CONVERT_TOOLS, AUTOMATE_TOOLS, MORE_TOOLS } from "@/lib/tools-catalog";
import { SITE_URL } from "@/lib/site";

const TITLE = "All Tools — PDF Genie";
const DESCRIPTION = "Every PDF, image, and document tool in one place — merge, split, compress, convert, sign, and more. All free, all in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/tools`, siteName: "PDF Genie", type: "website" },
};

export default function ToolsPage() {
  return (
    <div className="min-h-[100svh] px-6 pb-20 pt-24 lg:px-10 lg:pt-28">
      <div className="mx-auto max-w-7xl">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
          All tools
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-brand-brown-dark sm:text-4xl">
          What do you need to do?
        </h1>
        <p className="mt-2 max-w-xl text-sm text-brand-brown-dark/65">
          Every tool runs entirely in your browser — pick one below to get started.
        </p>

        <ToolSection
          eyebrow="Automate"
          title="Reach your whole list"
          tools={AUTOMATE_TOOLS}
          accent="from-fuchsia-500 to-pink-500"
          className="mt-8"
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
        <ToolSection
          eyebrow="More tools"
          title="Images, QR codes, and more"
          tools={MORE_TOOLS}
          accent="from-sky-500 to-indigo-500"
        />

        <PrivacyNote />
      </div>
    </div>
  );
}
