import type { Metadata } from "next";
import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";
import { SITE_URL, metaDescription } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage("refund-policy");
  const description = metaDescription(page.body);
  return {
    title: `${page.title} — PDF Genie`,
    description,
    alternates: { canonical: `${SITE_URL}/refund-policy` },
    openGraph: { title: `${page.title} — PDF Genie`, description, url: `${SITE_URL}/refund-policy`, siteName: "PDF Genie", type: "website" },
  };
}

export default async function RefundPolicyPage() {
  const page = await getContentPage("refund-policy");
  return <ContentPageView title={page.title} body={page.body} />;
}
