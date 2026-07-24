import type { Metadata } from "next";
import ResetPasswordPageClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Reset password — PDF Genie",
  description: "Set a new password for your PDF Genie account.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return <ResetPasswordPageClient params={params} />;
}
