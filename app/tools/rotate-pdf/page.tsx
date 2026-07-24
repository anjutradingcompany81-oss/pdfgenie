import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./RotatePdfClient";

const TITLE = "Rotate PDF — PDF Genie";
const DESCRIPTION = "Turn every page 90°, 180°, or 270°.";
const PATH = "/tools/rotate-pdf";

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
