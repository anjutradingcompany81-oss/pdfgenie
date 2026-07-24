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
  RotateCw,
  FileSpreadsheet,
  Table,
  ScanText,
} from "lucide-react";
import type { Tool } from "@/components/tools/ToolCard";

export const CORE_TOOLS: Tool[] = [
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

export const ORGANIZE_TOOLS: Tool[] = [
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
  {
    href: "/tools/rotate-pdf",
    icon: RotateCw,
    title: "Rotate PDF",
    copy: "Turn every page 90°, 180°, or 270°.",
  },
];

export const CONVERT_TOOLS: Tool[] = [
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
    copy: "Turn a .docx file into a PDF.",
  },
  {
    href: "/tools/pdf-to-word",
    icon: FileDown,
    title: "PDF to Word",
    copy: "Turn a PDF into an editable .docx file.",
  },
  {
    href: "/tools/pdf-to-excel",
    icon: FileSpreadsheet,
    title: "PDF to Excel",
    copy: "Pull a PDF's text into a spreadsheet, one row per line.",
  },
  {
    href: "/tools/excel-to-pdf",
    icon: Table,
    title: "Excel to PDF",
    copy: "Turn a spreadsheet's first sheet into a PDF table.",
  },
  {
    href: "/tools/ocr-pdf",
    icon: ScanText,
    title: "OCR PDF",
    copy: "Turn a scanned PDF into a searchable one with selectable text.",
  },
];

export const AUTOMATE_TOOLS: Tool[] = [
  {
    href: "/tools/mail-merge",
    icon: Mail,
    title: "Mail Merge",
    copy: "Send personalized emails to a list from Excel, with PDF attachments. Free plan: 30 emails/job.",
  },
];
