"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  FileEdit,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/dashboard/users", label: "Users", icon: Users },
  { href: "/admin/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/dashboard/settings", label: "Site settings", icon: Settings },
  { href: "/admin/dashboard/content", label: "Content", icon: FileEdit },
];

export function AdminSidebar({ name }: { name?: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-brand-brown-dark/10 lg:w-64 lg:border-r">
      <div className="flex items-center justify-between lg:block">
        <div>
          <p className="text-lg font-bold text-brand-brown-dark">
            PDF<span className="text-brand-blue">Genie</span>
          </p>
          <p className="mt-1 text-xs text-brand-brown-dark/70">{name}</p>
        </div>
      </div>

      <nav className="mt-8 flex gap-2 overflow-x-auto lg:mt-10 lg:flex-col lg:overflow-visible">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              data-hover="true"
              className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors lg:rounded-xl ${
                active
                  ? "bg-brand-blue-deep text-white"
                  : "text-brand-brown-dark/70 hover:bg-brand-cream"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        data-hover="true"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-6 hidden items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-brown-dark/70 hover:bg-brand-cream lg:flex"
      >
        <LogOut size={16} />
        Log out
      </button>
    </aside>
  );
}
