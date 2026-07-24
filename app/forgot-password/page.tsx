import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import ForgotPasswordPageClient from "./ForgotPasswordClient";

const TITLE = "Forgot password — PDF Genie";
const DESCRIPTION = "Reset your PDF Genie account password.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/forgot-password` },
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
