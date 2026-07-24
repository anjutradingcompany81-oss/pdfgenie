import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./MergeImagesClient";

const TITLE = "Merge images — PDF Genie";
const DESCRIPTION = "Combine several images into one — stacked or side-by-side.";
const PATH = "/tools/merge-images";

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
