import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./FillPdfClient";

const TITLE = "Fill PDF — PDF Genie";
const DESCRIPTION = "Detects fillable form fields and lets you fill them right in the browser.";
const PATH = "/tools/fill-pdf";

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
