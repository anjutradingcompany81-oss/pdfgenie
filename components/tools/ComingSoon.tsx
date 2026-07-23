import { Clock } from "lucide-react";

export function ComingSoon({ note }: { note: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-brand-brown-dark/20 bg-white px-5 py-4">
      <Clock size={18} className="mt-0.5 shrink-0 text-brand-blue-deep" />
      <p className="text-sm text-brand-brown-dark/70">{note}</p>
    </div>
  );
}
