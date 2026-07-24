import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./DeletePagesClient";

const TITLE = "Delete pages — PDF Genie";
const DESCRIPTION = "Pick pages to delete and download the rest.";
const PATH = "/tools/delete-pages";

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
