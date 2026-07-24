import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./ConvertImageClient";

const TITLE = "Convert Image — PDF Genie";
const DESCRIPTION = "Turn PDF pages into JPG or PNG images, or turn JPG/PNG images into a PDF.";
const PATH = "/tools/convert-image";

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
