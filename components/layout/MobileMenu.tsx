"use client";

import { motion } from "framer-motion";
import NextLink from "next/link";
import { signOut } from "next-auth/react";
import { MagneticButton } from "@/components/ui/MagneticButton";

type Link_ = { href: string; label: string; route?: boolean };

export function MobileMenu({
  onClose,
  links,
  isAuthed = false,
}: {
  onClose: () => void;
  links: Link_[];
  isAuthed?: boolean;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-brand-blue-deep px-6 py-6 text-white md:hidden"
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

      <nav className="mt-16 flex flex-1 flex-col justify-center gap-8">
        {links.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
          >
            {link.route ? (
              <NextLink
                href={link.href}
                onClick={onClose}
                className="text-4xl font-bold tracking-tight"
              >
                {link.label}
              </NextLink>
            ) : (
              <a
                href={link.href}
                onClick={onClose}
                className="text-4xl font-bold tracking-tight"
              >
                {link.label}
              </a>
            )}
          </motion.div>
        ))}
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {isAuthed ? (
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
        ) : (
          <MagneticButton href="/signup" onClick={onClose} variant="inverted" className="w-full justify-center">
            Sign up
          </MagneticButton>
        )}
      </motion.div>
    </motion.div>
  );
}
