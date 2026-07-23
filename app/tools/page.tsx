import {
  Combine,
  Scissors,
  FileArchive,
  RefreshCw,
  PenTool,
  ShieldCheck,
  FileInput,
  FileMinus2,
  FileX2,
  Lock,
  Unlock,
  Stamp,
  Scaling,
  Type,
  ImagePlus,
  FileImage,
  ImageDown,
  FileText,
  FileType,
  Images,
  FileUp,
  FileDown,
  Mail,
} from "lucide-react";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { ToolCard, type Tool } from "@/components/tools/ToolCard";
import { Reveal } from "@/components/ui/Reveal";

const CORE_TOOLS: Tool[] = [
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

const ORGANIZE_TOOLS: Tool[] = [
  {
    href: "/tools/insert-pages",
    icon: FileInput,
    title: "Insert pages",
    copy: "Drop the pages of one PDF into another, right where you want them.",
  },
  {
    href: "/tools/remove-pages",
    icon: FileMinus2,
    title: "Remove pages",
    copy: "Select pages you don't need and get back a cleaner PDF.",
  },
  {
    href: "/tools/delete-pages",
    icon: FileX2,
    title: "Delete pages",
    copy: "Pick pages to delete and download the rest.",
  },
  {
    href: "/tools/add-password",
    icon: Lock,
    title: "Add password",
    copy: "Lock a PDF behind a password so only your recipients can open it.",
  },
  {
    href: "/tools/remove-password",
    icon: Unlock,
    title: "Remove password",
    copy: "Unlock a password-protected PDF so it opens without a prompt.",
  },
  {
    href: "/tools/add-watermark",
    icon: Stamp,
    title: "Add watermark",
    copy: "Stamp text diagonally across every page.",
  },
  {
    href: "/tools/resize-pdf",
    icon: Scaling,
    title: "Resize PDF",
    copy: "Rescale every page to a new paper size.",
  },
  {
    href: "/tools/add-text",
    icon: Type,
    title: "Add text",
    copy: "Type a line of text and click where it should go.",
  },
];

const CONVERT_TOOLS: Tool[] = [
  {
    href: "/tools/image-to-pdf",
    icon: ImagePlus,
    title: "Image to PDF",
    copy: "Combine one or more images into a single PDF.",
  },
  {
    href: "/tools/pdf-to-jpg",
    icon: FileImage,
    title: "PDF to JPG",
    copy: "Turn every page of a PDF into a JPG image.",
  },
  {
    href: "/tools/pdf-to-png",
    icon: ImageDown,
    title: "PDF to PNG",
    copy: "Turn every page of a PDF into a PNG image.",
  },
  {
    href: "/tools/pdf-to-text",
    icon: FileText,
    title: "PDF to text",
    copy: "Pull the selectable text out of a PDF into a .txt file.",
  },
  {
    href: "/tools/text-to-pdf",
    icon: FileType,
    title: "Text to PDF",
    copy: "Type or paste text and turn it into a clean PDF.",
  },
  {
    href: "/tools/extract-images",
    icon: Images,
    title: "Extract images",
    copy: "Pull every embedded image out of a PDF as separate files.",
  },
  {
    href: "/tools/word-to-pdf",
    icon: FileUp,
    title: "Word to PDF",
    copy: "Turn a .doc or .docx file into a PDF.",
  },
  {
    href: "/tools/pdf-to-word",
    icon: FileDown,
    title: "PDF to Word",
    copy: "Turn a PDF into an editable .docx file.",
  },
];

const AUTOMATE_TOOLS: Tool[] = [
  {
    href: "/tools/mail-merge",
    icon: Mail,
    title: "Mail Merge",
    copy: "Send personalized emails to a list from Excel, with PDF attachments. Free plan: 30 emails/job.",
  },
];

function ToolSection({
  eyebrow,
  title,
  tools,
}: {
  eyebrow: string;
  title: string;
  tools: Tool[];
}) {
  return (
    <Reveal className="mt-20 first:mt-0">
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-brand-brown-dark sm:text-3xl">
        {title}
      </h2>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.href} {...tool} />
        ))}
      </div>
    </Reveal>
  );
}

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

        <ToolSection eyebrow="Core tools" title="The essentials" tools={CORE_TOOLS} />
        <ToolSection eyebrow="Organize PDF" title="Rework a PDF's pages" tools={ORGANIZE_TOOLS} />
        <ToolSection eyebrow="Convert PDF" title="Move between formats" tools={CONVERT_TOOLS} />
        <ToolSection eyebrow="Automate" title="Reach your whole list" tools={AUTOMATE_TOOLS} />

        <PrivacyNote />
      </div>
    </div>
  );
}
