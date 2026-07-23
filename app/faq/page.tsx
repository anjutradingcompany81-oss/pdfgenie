import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const page = await getContentPage("faq");
  return <ContentPageView title={page.title} body={page.body} />;
}
