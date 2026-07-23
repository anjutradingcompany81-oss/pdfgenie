"use client";

import { ImageDown } from "lucide-react";
import { PdfToImageTool } from "@/components/tools/PdfToImageTool";

export default function PdfToPngPage() {
  return (
    <PdfToImageTool
      icon={ImageDown}
      title="Convert PDF to PNG"
      description="Turn every page of a PDF into a PNG image, downloaded as a .zip."
      format="png"
    />
  );
}
