import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./WatermarkClient";

const TITLE = "Watermark — PDF Genie";
const DESCRIPTION = "Stamp text across every page, or cover a repeated watermark that's already there.";
const PATH = "/tools/watermark";

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
