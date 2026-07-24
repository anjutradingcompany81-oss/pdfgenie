import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./CropPdfClient";

const TITLE = "Crop PDF — PDF Genie";
const DESCRIPTION = "Drag a selection to the area you want to keep, applied to every page.";
const PATH = "/tools/crop-pdf";

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
