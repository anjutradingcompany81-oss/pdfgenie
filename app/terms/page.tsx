import type { Metadata } from "next";
import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";
import { SITE_URL, metaDescription } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage("terms");
  const description = metaDescription(page.body);
  return {
    title: `${page.title} — PDF Genie`,
    description,
    alternates: { canonical: `${SITE_URL}/terms` },
    openGraph: { title: `${page.title} — PDF Genie`, description, url: `${SITE_URL}/terms`, siteName: "PDF Genie", type: "website" },
  };
}

export default async function TermsPage() {
  const page = await getContentPage("terms");
  return <ContentPageView title={page.title} body={page.body} />;
}
