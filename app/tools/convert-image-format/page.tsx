import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./ConvertImageFormatClient";

const TITLE = "Convert Image Format — PDF Genie";
const DESCRIPTION = "Convert between JPG and PNG — batch as many as you like.";
const PATH = "/tools/convert-image-format";

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
