"use client";

// TODO: Convert a PDF to an editable .docx. Reconstructing paragraphs,
// formatting, and layout from a PDF's positioned-glyph text (unlike plain
// extraction — see lib/pdf/text.ts's extractText) into a real Word document
// needs a proper document-generation library — none is in this project yet.
import { FileDown } from "lucide-react";
import { PlaceholderTool } from "@/components/tools/PlaceholderTool";

export default function PdfToWordPage() {
  return (
    <PlaceholderTool
      icon={FileDown}
      title="Convert PDF to Word"
      description="Turn a PDF into an editable .docx file."
      accept="application/pdf"
      dropLabel="Drop a PDF here, or click to browse"
      actionLabel="Convert to Word"
      comingSoonNote="PDF-to-Word conversion isn't available yet — check back soon."
    />
  );
}
