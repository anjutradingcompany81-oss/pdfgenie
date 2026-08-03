import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./PdfaCheckClient";

const TITLE = "PDF/A Compliance Check — PDF Genie";
const DESCRIPTION = "Check a PDF against the most common PDF/A-1b archival requirements — fonts, encryption, JavaScript, metadata.";
const PATH = "/tools/pdfa-check";

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
