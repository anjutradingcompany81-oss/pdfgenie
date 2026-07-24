import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./RemovePagesClient";

const TITLE = "Remove pages — PDF Genie";
const DESCRIPTION = "Select pages you don't need and get back a cleaner PDF.";
const PATH = "/tools/remove-pages";

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
