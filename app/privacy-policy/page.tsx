import { getContentPage } from "@/lib/content-pages";
import { ContentPageView } from "@/components/layout/ContentPageView";

export default async function PrivacyPolicyPage() {
  const page = await getContentPage("privacy-policy");
  return <ContentPageView title={page.title} body={page.body} />;
}
