import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type Tool = {
  href: string;
  icon: LucideIcon;
  title: string;
  copy: string;
};

export function ToolCard({ href, icon: Icon, title, copy }: Tool) {
  return (
    <Link
      href={href}
      data-hover="true"
      className="group rounded-3xl border border-brand-brown-dark/10 bg-white p-8 transition-colors duration-300 hover:border-brand-blue/30"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue-deep transition-transform duration-300 group-hover:scale-110 group-hover:bg-brand-blue-deep group-hover:text-white">
        <Icon size={26} strokeWidth={2} />
      </div>
      <h3 className="mt-6 text-2xl font-bold text-brand-brown-dark">{title}</h3>
      <p className="mt-3 text-brand-brown-dark/65">{copy}</p>
    </Link>
  );
}
