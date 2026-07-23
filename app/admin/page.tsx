import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { DeployPanel } from "@/components/admin/DeployPanel";

export default async function AdminPage() {
  const authed = await getAdminSession();
  if (!authed) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-[100svh] px-6 pb-28 pt-32 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-blue-deep">
          Admin
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-brown-dark sm:text-5xl">
          Website control
        </h1>
        <p className="mt-4 text-brand-brown-dark/65">
          Manage deployments for pdfgenie.in.
        </p>

        <DeployPanel />
      </div>
    </div>
  );
}
