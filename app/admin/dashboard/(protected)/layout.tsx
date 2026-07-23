import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/require-admin";
import { AdminSidebar } from "@/components/admin-dashboard/AdminSidebar";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="min-h-[100svh] px-6 pb-20 pt-32 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 lg:flex-row">
        <AdminSidebar name={session.user.name} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
