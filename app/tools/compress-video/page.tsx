import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./CompressVideoClient";

const TITLE = "Compress video — PDF Genie";
const DESCRIPTION = "Shrink a video's file size while keeping it watchable.";
const PATH = "/tools/compress-video";

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
