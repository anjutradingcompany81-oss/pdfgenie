import { Users, UserCheck, Wrench, HardDrive, UserPlus, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db";
import { getUploadsStorageBytes } from "@/lib/uploads";
import { daysAgo } from "@/lib/dates";
import { StatCard } from "@/components/admin-dashboard/StatCard";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminDashboardHome() {
  const sevenDaysAgo = daysAgo(7);

  const [totalUsers, activeUsers, newRegistrations, toolEventsTotal, storageBytes, popularTools] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { disabled: false } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.toolUsageEvent.count(),
      getUploadsStorageBytes(),
      prisma.toolUsageEvent.groupBy({
        by: ["toolSlug"],
        _count: { toolSlug: true },
        orderBy: { _count: { toolSlug: "desc" } },
        take: 5,
      }),
    ]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-brand-brown-dark">Dashboard</h1>
      <p className="mt-2 text-brand-brown-dark/70">An overview of your site.</p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total users" value={String(totalUsers)} />
        <StatCard icon={UserCheck} label="Active users" value={String(activeUsers)} />
        <StatCard icon={UserPlus} label="New registrations" value={String(newRegistrations)} note="Last 7 days" />
        <StatCard
          icon={Wrench}
          label="Tool actions tracked"
          value={String(toolEventsTotal)}
          note="Usage tracking isn't wired into every tool page yet"
        />
        <StatCard
          icon={HardDrive}
          label="Storage used"
          value={formatBytes(storageBytes)}
          note="Profile pictures only — PDFs are processed in the browser and never uploaded"
        />
        <StatCard
          icon={TrendingUp}
          label="Daily visitors"
          value="—"
          note="Not tracked — this site has no page-view analytics configured"
        />
      </div>

      <div className="mt-10 rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
        <h2 className="text-lg font-bold text-brand-brown-dark">Most-used tools</h2>
        {popularTools.length === 0 ? (
          <p className="mt-3 text-sm text-brand-brown-dark/70">No tool usage recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {popularTools.map((tool) => (
              <li
                key={tool.toolSlug}
                className="flex items-center justify-between border-b border-brand-brown-dark/5 pb-2 text-sm last:border-0"
              >
                <span className="text-brand-brown-dark">{tool.toolSlug}</span>
                <span className="font-semibold text-brand-brown-dark/70">
                  {tool._count.toolSlug} uses
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
