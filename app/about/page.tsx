import type { Metadata } from "next";
import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";
import { SITE_URL, metaDescription } from "@/lib/site";

// Not statically prerendered: admin edits to this content should show up
// immediately, not just after the next deploy/rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getContentPage("about");
  const description = metaDescription(page.body);
  return {
    title: `${page.title} — PDF Genie`,
    description,
    alternates: { canonical: `${SITE_URL}/about` },
    openGraph: { title: `${page.title} — PDF Genie`, description, url: `${SITE_URL}/about`, siteName: "PDF Genie", type: "website" },
  };
}

export default async function AboutPage() {
  const page = await getContentPage("about");
  return <ContentPageView title={page.title} body={page.body} />;
}
