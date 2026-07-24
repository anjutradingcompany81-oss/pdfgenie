import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./ExtractImagesClient";

const TITLE = "Extract images — PDF Genie";
const DESCRIPTION = "Pull every embedded image out of a PDF as separate files.";
const PATH = "/tools/extract-images";

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
