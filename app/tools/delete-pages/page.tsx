"use client";

import { FileX2 } from "lucide-react";
import { PageRemovalTool } from "@/components/tools/PageRemovalTool";

export default function DeletePagesPage() {
  return (
    <PageRemovalTool
      icon={FileX2}
      title="Delete PDF pages"
      description="Pick the pages to delete and get back a PDF with just the rest."
      selectionHint="Select at least one page to delete."
      actionLabel="Delete selected pages"
      actionLabelBusy="Deleting…"
      outputFileName="pages-deleted.pdf"
    />
  );
}
