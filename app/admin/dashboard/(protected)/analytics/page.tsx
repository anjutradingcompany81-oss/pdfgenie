import { prisma } from "@/lib/db";
import { ComingSoon } from "@/components/tools/ComingSoon";
import { daysAgo } from "@/lib/dates";

async function getDailyUsage() {
  const since = daysAgo(14);
  const events = await prisma.toolUsageEvent.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (const event of events) {
    const day = event.createdAt.toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
}

export default async function AdminAnalyticsPage() {
  const [mostUsed, dailyUsage, monthlyTotal] = await Promise.all([
    prisma.toolUsageEvent.groupBy({
      by: ["toolSlug"],
      _count: { toolSlug: true },
      orderBy: { _count: { toolSlug: "desc" } },
      take: 10,
    }),
    getDailyUsage(),
    prisma.toolUsageEvent.count({
      where: { createdAt: { gte: daysAgo(30) } },
    }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-brand-brown-dark">Tool analytics</h1>
      <p className="mt-2 text-brand-brown-dark/60">
        {monthlyTotal} tool actions tracked in the last 30 days.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
          <h2 className="text-lg font-bold text-brand-brown-dark">Most-used tools</h2>
          {mostUsed.length === 0 ? (
            <p className="mt-3 text-sm text-brand-brown-dark/55">No usage recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {mostUsed.map((tool) => (
                <li
                  key={tool.toolSlug}
                  className="flex items-center justify-between border-b border-brand-brown-dark/5 pb-2 text-sm last:border-0"
                >
                  <span className="text-brand-brown-dark">{tool.toolSlug}</span>
                  <span className="font-semibold text-brand-brown-dark/60">
                    {tool._count.toolSlug}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
          <h2 className="text-lg font-bold text-brand-brown-dark">Daily usage (last 14 days)</h2>
          {dailyUsage.length === 0 ? (
            <p className="mt-3 text-sm text-brand-brown-dark/55">No usage recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {dailyUsage.map(([day, count]) => (
                <li key={day} className="flex items-center justify-between border-b border-brand-brown-dark/5 pb-2 text-sm last:border-0">
                  <span className="text-brand-brown-dark">{day}</span>
                  <span className="font-semibold text-brand-brown-dark/60">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <ComingSoon note="Error logs aren't collected yet — each tool page's try/catch would need to report failures to a logging endpoint before this can show real data." />
        <ComingSoon note="Detailed processing statistics (conversion time, file sizes) aren't instrumented yet — only which tool was used and when is currently tracked." />
      </div>
    </div>
  );
}
