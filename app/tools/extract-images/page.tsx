"use client";

// TODO: Extract embedded raster images from a PDF. Requires walking each
// page's operator list from pdfjs-dist (OPS.paintImageXObject /
// paintJpegXObject), resolving each image via page.objs.get(), and
// re-encoding raw bitmaps to PNG via canvas. Left as a placeholder rather
// than a partial implementation since a subtly-wrong image extractor is
// worse than an honest "coming soon".
import { Images } from "lucide-react";
import { PlaceholderTool } from "@/components/tools/PlaceholderTool";

export default function ExtractImagesPage() {
  return (
    <PlaceholderTool
      icon={Images}
      title="Extract images from a PDF"
      description="Pull every embedded image out of a PDF as separate files."
      accept="application/pdf"
      dropLabel="Drop a PDF here, or click to browse"
      actionLabel="Extract images"
      comingSoonNote="Image extraction isn't available yet — check back soon."
    />
  );
}
