import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./CompareClient";

const TITLE = "Compare PDFs — PDF Genie";
const DESCRIPTION = "See exactly what changed between two versions of a PDF, page by page.";
const PATH = "/tools/compare-pdf";

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
