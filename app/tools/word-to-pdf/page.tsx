"use client";

// TODO: Convert a .doc/.docx file to PDF. No client-side library in this
// project can parse Word's binary/OOXML formats and lay out a faithful PDF
// from them — this needs either a dedicated conversion library or a server
// step, neither of which exist here yet (the app is otherwise fully
// client-side by design; see components/tools/PrivacyNote.tsx).
import { FileUp } from "lucide-react";
import { PlaceholderTool } from "@/components/tools/PlaceholderTool";

export default function WordToPdfPage() {
  return (
    <PlaceholderTool
      icon={FileUp}
      title="Convert Word to PDF"
      description="Turn a .doc or .docx file into a PDF."
      accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      dropLabel="Drop a Word document here, or click to browse"
      actionLabel="Convert to PDF"
      comingSoonNote="Word-to-PDF conversion isn't available yet — check back soon."
    />
  );
}
