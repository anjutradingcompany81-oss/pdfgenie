import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";

export default async function AboutPage() {
  const page = await getContentPage("about");
  return <ContentPageView title={page.title} body={page.body} />;
}
