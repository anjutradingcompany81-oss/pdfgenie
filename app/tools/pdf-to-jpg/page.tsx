"use client";

import { FileImage } from "lucide-react";
import { PdfToImageTool } from "@/components/tools/PdfToImageTool";

export default function PdfToJpgPage() {
  return (
    <PdfToImageTool
      icon={FileImage}
      title="Convert PDF to JPG"
      description="Turn every page of a PDF into a JPG image, downloaded as a .zip."
      format="jpeg"
    />
  );
}
