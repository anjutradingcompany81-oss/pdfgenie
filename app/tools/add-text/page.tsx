import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./AddTextClient";

const TITLE = "Add text — PDF Genie";
const DESCRIPTION = "Type a line of text and click where it should go.";
const PATH = "/tools/add-text";

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
