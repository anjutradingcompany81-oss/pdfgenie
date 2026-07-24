import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import SignUpPageClient from "./SignupClient";

const TITLE = "Sign up — PDF Genie";
const DESCRIPTION = "Create a free PDF Genie account — no credit card needed.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/signup` },
  robots: { index: false, follow: true },
};

export default function SignUpPage() {
  return <SignUpPageClient />;
}
