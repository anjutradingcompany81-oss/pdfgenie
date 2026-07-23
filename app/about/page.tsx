import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";

// Not statically prerendered: admin edits to this content should show up
// immediately, not just after the next deploy/rebuild.
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const page = await getContentPage("about");
  return <ContentPageView title={page.title} body={page.body} />;
}
