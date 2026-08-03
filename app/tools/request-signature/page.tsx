import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./RequestSignatureClient";

const TITLE = "Request a Signature — PDF Genie";
const DESCRIPTION = "Mark where a signature goes and get a shareable link — anyone with the link can open and sign the PDF.";
const PATH = "/tools/request-signature";

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
