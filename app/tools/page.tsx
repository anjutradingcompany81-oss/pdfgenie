import Link from "next/link";
import {
  Combine,
  Scissors,
  FileArchive,
  RefreshCw,
  PenTool,
  ShieldCheck,
} from "lucide-react";
import { PrivacyNote } from "@/components/tools/PrivacyNote";

const TOOLS = [
  {
    href: "/tools/merge",
    icon: Combine,
    title: "Merge",
    copy: "Combine multiple PDFs into one document.",
  },
  {
    href: "/tools/split",
    icon: Scissors,
    title: "Split",
    copy: "Extract pages or break a PDF into individual files.",
  },
  {
    href: "/tools/compress",
    icon: FileArchive,
    title: "Compress",
    copy: "Shrink file size while keeping it readable.",
  },
  {
    href: "/tools/convert",
    icon: RefreshCw,
    title: "Convert",
    copy: "Turn PDF pages into images, or images into a PDF.",
  },
  {
    href: "/tools/sign",
    icon: PenTool,
    title: "E-sign",
    copy: "Draw or type a signature and place it on the page.",
  },
  {
    href: "/tools/encrypt",
    icon: ShieldCheck,
    title: "Encrypt",
    copy: "Lock a PDF behind a password.",
  },
];

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

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map(({ href, icon: Icon, title, copy }) => (
            <Link
              key={href}
              href={href}
              data-hover="true"
              className="group rounded-3xl border border-brand-brown-dark/10 bg-white p-8 transition-colors duration-300 hover:border-brand-blue/30"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand-blue-deep group-hover:text-white">
                <Icon size={26} strokeWidth={2} />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-brand-brown-dark">{title}</h2>
              <p className="mt-3 text-brand-brown-dark/65">{copy}</p>
            </Link>
          ))}
        </div>

        <PrivacyNote />
      </div>
    </div>
  );
}
