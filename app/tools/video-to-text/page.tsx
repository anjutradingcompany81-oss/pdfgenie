import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./VideoToTextClient";

const TITLE = "Video to text — PDF Genie";
const DESCRIPTION = "Transcribe the spoken audio from a video, self-hosted on our server.";
const PATH = "/tools/video-to-text";

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
