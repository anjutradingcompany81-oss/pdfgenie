import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./MailMergeClient";

const TITLE = "Mail Merge — PDF Genie";
const DESCRIPTION = "Send personalized emails to a list from Excel, with PDF attachments. Free plan: 30 emails/job.";
const PATH = "/tools/mail-merge";

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
