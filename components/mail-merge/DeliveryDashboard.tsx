import { Ban, CheckCircle2, Clock, Mail, TrendingUp, XCircle } from "lucide-react";
import { StatCard } from "@/components/admin-dashboard/StatCard";

export type RecipientLike = {
  status: "PENDING" | "SENT" | "FAILED" | "CANCELLED";
  sentAt: Date | string | null;
  fields: Record<string, string> | null;
};

function BarRow({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-brand-brown-dark/70">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-brand-brown-dark/5">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs font-semibold text-brand-brown-dark">{value}</span>
    </div>
  );
}

function findFieldCI(fields: Record<string, string>, name: string): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(fields)) {
    if (key.toLowerCase() === target) return value;
  }
  return undefined;
}

export function DeliveryDashboard({
  recipients,
  createdAt,
  completedAt,
}: {
  recipients: RecipientLike[];
  createdAt: Date | string;
  completedAt: Date | string | null;
}) {
  const total = recipients.length;
  const sent = recipients.filter((r) => r.status === "SENT").length;
  const failed = recipients.filter((r) => r.status === "FAILED").length;
  const pending = recipients.filter((r) => r.status === "PENDING").length;
  const cancelled = recipients.filter((r) => r.status === "CANCELLED").length;
  const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;

  const start = new Date(createdAt);
  const finish = completedAt ? new Date(completedAt) : null;
  const durationSec = finish ? Math.max(0, Math.round((finish.getTime() - start.getTime()) / 1000)) : null;

  // Emails per minute, bucketed from actual send timestamps.
  const perMinute = new Map<string, number>();
  for (const r of recipients) {
    if (!r.sentAt) continue;
    const key = new Date(r.sentAt).toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    perMinute.set(key, (perMinute.get(key) ?? 0) + 1);
  }
  const perMinuteRows = [...perMinute.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const maxPerMinute = Math.max(1, ...perMinuteRows.map(([, v]) => v));

  // Department-wise distribution, only if a Department column exists.
  const departmentCounts = new Map<string, number>();
  for (const r of recipients) {
    const dept = r.fields ? findFieldCI(r.fields, "department") : undefined;
    if (dept) departmentCounts.set(dept, (departmentCounts.get(dept) ?? 0) + 1);
  }
  const departmentRows = [...departmentCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxDept = Math.max(1, ...departmentRows.map(([, v]) => v));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Mail} label="Total emails" value={String(total)} />
        <StatCard icon={CheckCircle2} label="Successfully sent" value={String(sent)} />
        <StatCard icon={XCircle} label="Failed" value={String(failed)} />
        <StatCard icon={Clock} label="Pending" value={String(pending)} />
        {cancelled > 0 && <StatCard icon={Ban} label="Cancelled" value={String(cancelled)} />}
        <StatCard icon={TrendingUp} label="Success rate" value={`${successRate}%`} />
        <StatCard icon={Clock} label="Duration" value={durationSec !== null ? `${durationSec}s` : "In progress"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
          <h3 className="text-sm font-bold text-brand-brown-dark">Success vs Failed</h3>
          <div className="mt-4 space-y-3">
            <BarRow label="Sent" value={sent} max={total} colorClass="bg-status-success" />
            <BarRow label="Failed" value={failed} max={total} colorClass="bg-status-danger" />
            <BarRow label="Pending" value={pending} max={total} colorClass="bg-status-warning" />
            {cancelled > 0 && (
              <BarRow label="Cancelled" value={cancelled} max={total} colorClass="bg-brand-brown-dark/40" />
            )}
          </div>
        </div>

        {perMinuteRows.length > 0 && (
          <div className="surface-card rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
            <h3 className="text-sm font-bold text-brand-brown-dark">Emails sent per minute</h3>
            <div className="mt-4 max-h-40 space-y-2 overflow-y-auto">
              {perMinuteRows.map(([minute, count]) => (
                <BarRow
                  key={minute}
                  label={minute.slice(11)}
                  value={count}
                  max={maxPerMinute}
                  colorClass="bg-brand-blue-deep"
                />
              ))}
            </div>
          </div>
        )}

        {departmentRows.length > 0 && (
          <div className="surface-card rounded-2xl border border-brand-brown-dark/10 bg-white p-6 lg:col-span-2">
            <h3 className="text-sm font-bold text-brand-brown-dark">Department-wise distribution</h3>
            <div className="mt-4 space-y-2">
              {departmentRows.map(([dept, count]) => (
                <BarRow key={dept} label={dept} value={count} max={maxDept} colorClass="bg-brand-blue" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
