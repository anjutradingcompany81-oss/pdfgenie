import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./ConvertExcelClient";

const TITLE = "Convert Excel — PDF Genie";
const DESCRIPTION = "Turn a spreadsheet into a PDF table, or a PDF into a spreadsheet.";
const PATH = "/tools/convert-excel";

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
