import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./DscClient";

const TITLE = "Digital Signature (DSC) — PDF Genie";
const DESCRIPTION = "Apply a real, certificate-based digital signature to one or many PDFs — placement, appearance, and security, entirely in your browser.";
const PATH = "/tools/digital-signature";

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
