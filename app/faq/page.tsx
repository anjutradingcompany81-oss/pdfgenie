import type { Metadata } from "next";
import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";
import { SITE_URL, metaDescription } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage("faq");
  const description = metaDescription(page.body);
  return {
    title: `${page.title} — PDF Genie`,
    description,
    alternates: { canonical: `${SITE_URL}/faq` },
    openGraph: { title: `${page.title} — PDF Genie`, description, url: `${SITE_URL}/faq`, siteName: "PDF Genie", type: "website" },
  };
}

export default async function FaqPage() {
  const page = await getContentPage("faq");
  return <ContentPageView title={page.title} body={page.body} />;
}
