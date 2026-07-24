import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./CompressClient";

const TITLE = "Compress — PDF Genie";
const DESCRIPTION = "Shrink file size while keeping it readable.";
const PATH = "/tools/compress";

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
