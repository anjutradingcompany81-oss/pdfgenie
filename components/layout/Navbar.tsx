"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { UserMenu } from "@/components/layout/UserMenu";

const BASE_NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/tools", label: "Tools", route: true },
  { href: "/#pricing", label: "Pricing" },
];

const LOGGED_OUT_LINKS = [
  ...BASE_NAV_LINKS,
  { href: "/admin/dashboard/login", label: "Admin", route: true },
];

const LOGGED_IN_LINKS = [
  { href: "/dashboard", label: "Dashboard", route: true },
  { href: "/tools", label: "Tools", route: true },
  { href: "/dashboard/profile", label: "Profile", route: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const { data: session, status } = useSession();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  const isAuthed = status === "authenticated";
  const navLinks = isAuthed ? LOGGED_IN_LINKS : LOGGED_OUT_LINKS;
  // Mobile has no separate button area, so "Log in" (handled as a standalone
  // text link on desktop) is folded into the link list here instead.
  const mobileLinks = isAuthed
    ? navLinks
    : [...BASE_NAV_LINKS, { href: "/login", label: "Log in", route: true }, ...LOGGED_OUT_LINKS.slice(BASE_NAV_LINKS.length)];

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-300 ${
          scrolled
            ? "bg-brand-cream/90 py-3 shadow-sm backdrop-blur-md"
            : "bg-transparent py-6"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-10">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain anchor is required so SmoothScroll's own click handler can smooth-scroll same-page, and fall back to a real navigation from other routes */}
          <a
            href="/#top"
            data-hover="true"
            className="text-lg font-bold tracking-tight text-brand-brown-dark"
          >
            PDF<span className="text-brand-blue">Genie</span>
          </a>

          <ul className="hidden items-center gap-10 md:flex">
            {navLinks.map((link) =>
              link.route ? (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-hover="true"
                    className="group relative text-sm font-semibold text-brand-brown-dark"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-brand-blue transition-all duration-300 group-hover:w-full" />
                  </Link>
                </li>
              ) : (
                <li key={link.href}>
                  <a
                    href={link.href}
                    data-hover="true"
                    className="group relative text-sm font-semibold text-brand-brown-dark"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-brand-blue transition-all duration-300 group-hover:w-full" />
                  </a>
                </li>
              )
            )}
          </ul>

          <div className="hidden items-center gap-5 md:flex">
            {isAuthed ? (
              <UserMenu name={session?.user?.name} image={session?.user?.image} />
            ) : (
              <>
                <Link
                  href="/login"
                  data-hover="true"
                  className="text-sm font-semibold text-brand-brown-dark hover:text-brand-blue-deep"
                >
                  Log in
                </Link>
                <MagneticButton href="/signup" className="px-6 py-3 text-xs">
                  Sign up
                </MagneticButton>
              </>
            )}
          </div>

          <button
            type="button"
            data-hover="true"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span className="h-0.5 w-6 bg-brand-brown-dark" />
            <span className="h-0.5 w-6 bg-brand-brown-dark" />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <MobileMenu onClose={() => setMenuOpen(false)} links={mobileLinks} isAuthed={isAuthed} />
        )}
      </AnimatePresence>
    </>
  );
}
