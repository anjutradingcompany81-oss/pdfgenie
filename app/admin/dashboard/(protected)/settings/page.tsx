import { getSiteSettings } from "@/lib/site-settings";
import { SiteSettingsForm } from "@/components/admin-dashboard/SiteSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-brand-brown-dark">Site settings</h1>
      <p className="mt-2 text-brand-brown-dark/60">General configuration for the site.</p>
      <SiteSettingsForm initial={settings} />
    </div>
  );
}
