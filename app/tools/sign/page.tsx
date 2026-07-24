import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./SignClient";

const TITLE = "E-sign — PDF Genie";
const DESCRIPTION = "Draw or type a signature and place it on the page.";
const PATH = "/tools/sign";

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
