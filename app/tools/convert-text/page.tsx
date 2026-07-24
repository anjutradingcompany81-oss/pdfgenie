import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./ConvertTextClient";

const TITLE = "Convert Text — PDF Genie";
const DESCRIPTION = "Pull the text out of a PDF, or turn plain text into a PDF.";
const PATH = "/tools/convert-text";

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
