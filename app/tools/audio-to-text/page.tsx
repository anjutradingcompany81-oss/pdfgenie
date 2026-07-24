import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./AudioToTextClient";

const TITLE = "Audio to text — PDF Genie";
const DESCRIPTION = "Transcribe speech from an audio file, self-hosted on our server.";
const PATH = "/tools/audio-to-text";

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
