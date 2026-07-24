import type { Metadata } from "next";
import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";
import { SITE_URL, metaDescription } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage("privacy-policy");
  const description = metaDescription(page.body);
  return {
    title: `${page.title} — PDF Genie`,
    description,
    alternates: { canonical: `${SITE_URL}/privacy-policy` },
    openGraph: { title: `${page.title} — PDF Genie`, description, url: `${SITE_URL}/privacy-policy`, siteName: "PDF Genie", type: "website" },
  };
}

export default async function PrivacyPolicyPage() {
  const page = await getContentPage("privacy-policy");
  return <ContentPageView title={page.title} body={page.body} />;
}
