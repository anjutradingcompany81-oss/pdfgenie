import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type Tool = {
  href: string;
  icon: LucideIcon;
  title: string;
  copy: string;
};

export function ToolCard({
  href,
  icon: Icon,
  title,
  copy,
  accent = "from-brand-blue to-brand-blue-deep",
}: Tool & { accent?: string }) {
  return (
    <Link
      href={href}
      data-hover="true"
      className="group relative overflow-hidden rounded-2xl border border-brand-brown-dark/10 bg-brand-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-blue/30 hover:shadow-xl hover:shadow-brand-blue-deep/10"
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25`}
      />
      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md shadow-brand-blue-deep/20 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6`}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <h3 className="relative mt-4 text-base font-bold text-brand-brown-dark">{title}</h3>
      <p className="relative mt-1.5 line-clamp-2 text-xs leading-relaxed text-brand-brown-dark/60">
        {copy}
      </p>
    </Link>
  );
}
