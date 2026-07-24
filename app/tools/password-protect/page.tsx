import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ToolClient from "./PasswordProtectClient";

const TITLE = "Password Protection — PDF Genie";
const DESCRIPTION = "Lock a PDF behind a password, or unlock one you already have the password for.";
const PATH = "/tools/password-protect";

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
