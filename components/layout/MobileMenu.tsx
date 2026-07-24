"use client";

import { motion } from "framer-motion";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useRef } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Avatar } from "@/components/ui/Avatar";
import { SearchTools } from "@/components/tools/SearchTools";
import { MobileToolCategories } from "@/components/tools/MobileToolCategories";
import { useModalA11y } from "@/components/ui/useModalA11y";
import { toolCategories } from "@/lib/tools";

const MARKETING_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
];

export function MobileMenu({
  onClose,
  isAuthed = false,
  userName,
  userEmail,
  userImage,
}: {
  onClose: () => void;
  isAuthed?: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(panelRef, true, onClose);

  return (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-brand-blue-deep px-6 py-6 text-white outline-none lg:hidden"
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      animate={{ clipPath: "inset(0 0 0% 0)" }}
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">
          PDF<span className="text-brand-blue-light">Genie</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center text-2xl"
        >
          &times;
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mt-8"
      >
        <SearchTools variant="dark" className="w-full" onNavigate={onClose} />
      </motion.div>

      <motion.nav
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mt-6 flex flex-wrap gap-x-6 gap-y-2"
      >
        {MARKETING_LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={onClose} className="text-sm font-semibold text-white/70">
            {link.label}
          </a>
        ))}
        {!isAuthed && (
          <NextLink href="/admin/dashboard/login" onClick={onClose} className="text-sm font-semibold text-white/70">
            Admin
          </NextLink>
        )}
      </motion.nav>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mt-6 flex-1"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">Tools</p>
        <MobileToolCategories categories={toolCategories} activeHref={pathname} onNavigate={onClose} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mt-8 border-t border-white/15 pt-6"
      >
        {isAuthed ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar image={userImage} size={40} iconSize={20} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{userName || "Account"}</p>
                {userEmail && <p className="truncate text-xs text-white/60">{userEmail}</p>}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-semibold text-white/70">
              <NextLink href="/dashboard" onClick={onClose}>
                Dashboard
              </NextLink>
              <NextLink href="/dashboard/profile" onClick={onClose}>
                My Profile
              </NextLink>
            </div>
            <MagneticButton
              onClick={() => {
                onClose();
                signOut({ callbackUrl: "/" });
              }}
              variant="inverted"
              className="w-full justify-center"
            >
              Log out
            </MagneticButton>
          </div>
        ) : (
          <div className="space-y-3">
            <NextLink href="/login" onClick={onClose} className="block text-center text-sm font-semibold text-white/85">
              Log in
            </NextLink>
            <MagneticButton href="/signup" onClick={onClose} variant="inverted" className="w-full justify-center">
              Sign up
            </MagneticButton>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
