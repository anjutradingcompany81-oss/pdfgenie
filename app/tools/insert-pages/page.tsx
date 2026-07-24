import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./InsertPagesClient";

const TITLE = "Insert pages — PDF Genie";
const DESCRIPTION = "Drop the pages of one PDF into another, right where you want them.";
const PATH = "/tools/insert-pages";

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
