import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./ConvertWordClient";

const TITLE = "Convert Word — PDF Genie";
const DESCRIPTION = "Turn a .docx into a PDF, or a PDF into an editable .docx.";
const PATH = "/tools/convert-word";

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
