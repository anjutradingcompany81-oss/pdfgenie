import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./EditPdfClient";

const TITLE = "Edit PDF — PDF Genie";
const DESCRIPTION = "Drop text anywhere on the page — add as many notes as you need.";
const PATH = "/tools/edit-pdf";

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
