import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";

export default async function TermsPage() {
  const page = await getContentPage("terms");
  return <ContentPageView title={page.title} body={page.body} />;
}
