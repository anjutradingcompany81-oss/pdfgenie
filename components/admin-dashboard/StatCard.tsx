import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue-deep">
        <Icon size={18} />
      </div>
      <p className="mt-4 text-2xl font-bold text-brand-brown-dark">{value}</p>
      <p className="mt-1 text-sm text-brand-brown-dark/70">{label}</p>
      {note && <p className="mt-1 text-xs text-brand-brown-dark/70">{note}</p>}
    </div>
  );
}
