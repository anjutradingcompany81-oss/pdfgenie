import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./CompressImagesClient";

const TITLE = "Compress images — PDF Genie";
const DESCRIPTION = "Shrink JPG, PNG, or WebP images — batch as many as you like.";
const PATH = "/tools/compress-images";

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
