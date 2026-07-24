import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./ResizeJpgClient";

const TITLE = "Resize JPG — PDF Genie";
const DESCRIPTION = "Set new dimensions and download a resized copy.";
const PATH = "/tools/resize-jpg";

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
