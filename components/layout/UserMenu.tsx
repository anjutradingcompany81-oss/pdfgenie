"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Settings, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";

export function UserMenu({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const firstName = name?.split(" ")[0] || "Account";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-hover="true"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full border border-brand-brown-dark/15 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-brand-brown-dark transition-colors hover:border-brand-blue/40"
      >
        <Avatar image={image} size={28} iconSize={14} />
        {firstName}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-brand-brown-dark/10 bg-white py-2 shadow-lg"
        >
          <div className="flex items-center gap-3 border-b border-brand-brown-dark/10 px-4 py-3">
            <Avatar image={image} size={36} iconSize={18} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-brown-dark">{name || "Account"}</p>
              {email && <p className="truncate text-xs text-brand-brown-dark/70">{email}</p>}
            </div>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-brown-dark hover:bg-brand-cream"
          >
            <LayoutDashboard size={15} />
            Dashboard
          </Link>
          <Link
            href="/dashboard/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-brown-dark hover:bg-brand-cream"
          >
            <UserIcon size={15} />
            My Profile
          </Link>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex w-full cursor-not-allowed items-center gap-2 px-4 py-2.5 text-left text-sm text-brand-brown-dark/70"
          >
            <Settings size={15} />
            Account Settings
            <span className="ml-auto rounded-full bg-brand-brown-dark/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Soon
            </span>
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-brand-brown-dark hover:bg-brand-cream"
          >
            <LogOut size={15} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
