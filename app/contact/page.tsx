import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";

export default async function ContactPage() {
  const page = await getContentPage("contact");
  return <ContentPageView title={page.title} body={page.body} />;
}
