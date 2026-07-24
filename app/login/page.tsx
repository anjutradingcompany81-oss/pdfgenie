import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import LoginPageClient from "./LoginClient";

const TITLE = "Log in — PDF Genie";
const DESCRIPTION = "Log in to your PDF Genie account to access your dashboard and saved history.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/login` },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <LoginPageClient />;
}
