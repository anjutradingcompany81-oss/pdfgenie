import type { Metadata } from "next";
import SignClient from "./SignClient";

export const metadata: Metadata = {
  title: "Sign document — PDF Genie",
  description: "Review and sign a PDF that was shared with you.",
  robots: { index: false, follow: false },
};

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SignClient token={token} />;
}
