import {
  Combine,
  Scissors,
  FileArchive,
  RefreshCw,
  PenTool,
  FileInput,
  FileMinus2,
  FileX2,
  Lock,
  Stamp,
  Scaling,
  Type,
  FileType,
  Images,
  FileUp,
  Mail,
  RotateCw,
  FileSpreadsheet,
  ScanText,
  FileEdit,
  FormInput,
  LayoutGrid,
  Crop,
  ScanLine,
  GalleryHorizontal,
  Minimize2,
  Sparkles,
  QrCode,
  ArrowRightLeft,
  Maximize2,
  FileVideo,
  Languages,
  AudioLines,
  Captions,
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
    href: "/tools/convert-image",
    icon: RefreshCw,
    title: "Convert Image",
    copy: "Turn PDF pages into JPG or PNG images, or turn JPG/PNG images into a PDF.",
  },
  {
    href: "/tools/sign",
    icon: PenTool,
    title: "E-sign",
    copy: "Draw or type a signature and place it on the page.",
  },
  {
    href: "/tools/password-protect",
    icon: Lock,
    title: "Password Protection",
    copy: "Lock a PDF behind a password, or unlock one you already have the password for.",
  },
  {
    href: "/tools/edit-pdf",
    icon: FileEdit,
    title: "Edit PDF",
    copy: "Drop text anywhere on the page — add as many notes as you need.",
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
    href: "/tools/watermark",
    icon: Stamp,
    title: "Watermark",
    copy: "Stamp text across every page, or cover a repeated watermark that's already there.",
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
  {
    href: "/tools/fill-pdf",
    icon: FormInput,
    title: "Fill PDF",
    copy: "Detects fillable form fields and lets you fill them right in the browser.",
  },
  {
    href: "/tools/organize-pdf",
    icon: LayoutGrid,
    title: "Organize PDF",
    copy: "Drag to reorder pages, rotate or delete any of them, then save.",
  },
  {
    href: "/tools/crop-pdf",
    icon: Crop,
    title: "Crop PDF",
    copy: "Drag a selection to the area you want to keep, applied to every page.",
  },
];

export const CONVERT_TOOLS: Tool[] = [
  {
    href: "/tools/convert-text",
    icon: FileType,
    title: "Convert Text",
    copy: "Pull the text out of a PDF, or turn plain text into a PDF.",
  },
  {
    href: "/tools/extract-images",
    icon: Images,
    title: "Extract images",
    copy: "Pull every embedded image out of a PDF as separate files.",
  },
  {
    href: "/tools/convert-word",
    icon: FileUp,
    title: "Convert Word",
    copy: "Turn a .docx into a PDF, or a PDF into an editable .docx.",
  },
  {
    href: "/tools/convert-excel",
    icon: FileSpreadsheet,
    title: "Convert Excel",
    copy: "Turn a spreadsheet into a PDF table, or a PDF into a spreadsheet.",
  },
  {
    href: "/tools/ocr-pdf",
    icon: ScanText,
    title: "OCR PDF",
    copy: "Turn a scanned PDF into a searchable one with selectable text.",
  },
  {
    href: "/tools/image-text",
    icon: ScanLine,
    title: "Image & Text",
    copy: "Pull the text out of an image, or turn text into a shareable image.",
  },
  {
    href: "/tools/convert-image-format",
    icon: ArrowRightLeft,
    title: "Convert Image Format",
    copy: "Convert between JPG and PNG — batch as many as you like.",
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

export const MORE_TOOLS: Tool[] = [
  {
    href: "/tools/merge-images",
    icon: GalleryHorizontal,
    title: "Merge images",
    copy: "Combine several images into one — stacked or side-by-side.",
  },
  {
    href: "/tools/compress-images",
    icon: Minimize2,
    title: "Compress images",
    copy: "Shrink JPG, PNG, or WebP images — batch as many as you like.",
  },
  {
    href: "/tools/enhance-images",
    icon: Sparkles,
    title: "Enhance images",
    copy: "Adjust brightness, contrast, saturation, and sharpen.",
  },
  {
    href: "/tools/qr-code-generator",
    icon: QrCode,
    title: "QR code generator",
    copy: "Turn any text or link into a downloadable QR code.",
  },
  {
    href: "/tools/resize-jpg",
    icon: Maximize2,
    title: "Resize JPG",
    copy: "Set new dimensions and download a resized copy.",
  },
  {
    href: "/tools/compress-video",
    icon: FileVideo,
    title: "Compress video",
    copy: "Shrink a video's file size while keeping it watchable.",
  },
  {
    href: "/tools/translate",
    icon: Languages,
    title: "Language translator",
    copy: "Translate text between 12 languages, self-hosted on our server.",
  },
  {
    href: "/tools/audio-to-text",
    icon: AudioLines,
    title: "Audio to text",
    copy: "Transcribe speech from an audio file, self-hosted on our server.",
  },
  {
    href: "/tools/video-to-text",
    icon: Captions,
    title: "Video to text",
    copy: "Transcribe the spoken audio from a video, self-hosted on our server.",
  },
];
