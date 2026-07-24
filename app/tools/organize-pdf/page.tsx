import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./OrganizePdfClient";

const TITLE = "Organize PDF — PDF Genie";
const DESCRIPTION = "Drag to reorder pages, rotate or delete any of them, then save.";
const PATH = "/tools/organize-pdf";

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
