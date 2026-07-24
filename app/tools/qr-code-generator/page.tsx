import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./QrCodeGeneratorClient";

const TITLE = "QR code generator — PDF Genie";
const DESCRIPTION = "Turn any text or link into a downloadable QR code.";
const PATH = "/tools/qr-code-generator";

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
