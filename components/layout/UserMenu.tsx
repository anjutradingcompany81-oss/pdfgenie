"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function UserMenu({
  name,
  image,
}: {
  name?: string | null;
  image?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const firstName = name?.split(" ")[0] || "Account";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-hover="true"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-brand-brown-dark/15 py-1.5 pl-1.5 pr-4 text-sm font-semibold text-brand-brown-dark transition-colors hover:border-brand-blue/40"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue-deep">
            <UserIcon size={14} />
          </span>
        )}
        {firstName}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-brand-brown-dark/10 bg-white py-2 shadow-lg">
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
            Profile
          </Link>
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
