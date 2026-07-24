import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./MergeClient";

const TITLE = "Merge — PDF Genie";
const DESCRIPTION = "Combine multiple PDFs into one document.";
const PATH = "/tools/merge";

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
