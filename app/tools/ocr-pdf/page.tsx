import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./OcrPdfClient";

const TITLE = "OCR PDF — PDF Genie";
const DESCRIPTION = "Turn a scanned PDF into a searchable one with selectable text.";
const PATH = "/tools/ocr-pdf";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${PATH}`,
    siteName: "PDF Genie",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function Page() {
  return <ToolClient />;
}
