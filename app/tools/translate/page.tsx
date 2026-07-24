import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./TranslateClient";

const TITLE = "Language translator — PDF Genie";
const DESCRIPTION = "Translate text between 12 languages, self-hosted on our server.";
const PATH = "/tools/translate";

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
