import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./ResizePdfClient";

const TITLE = "Resize PDF — PDF Genie";
const DESCRIPTION = "Rescale every page to a new paper size.";
const PATH = "/tools/resize-pdf";

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
