"use client";

import { FileMinus2 } from "lucide-react";
import { PageRemovalTool } from "@/components/tools/PageRemovalTool";

export default function RemovePagesPage() {
  return (
    <PageRemovalTool
      icon={FileMinus2}
      title="Remove PDF pages"
      description="Select the pages you don't need and download a clean PDF without them."
      selectionHint="Select at least one page to remove."
      actionLabel="Remove selected pages"
      actionLabelBusy="Removing…"
      outputFileName="pages-removed.pdf"
    />
  );
}
