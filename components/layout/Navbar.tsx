"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { UserMenu } from "@/components/layout/UserMenu";
import { ToolDropdown } from "@/components/tools/ToolDropdown";
import { SearchTools } from "@/components/tools/SearchTools";
import { toolCategories } from "@/lib/tools";

const MARKETING_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const { data: session, status } = useSession();
  const dropdownAreaRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const activeCategory = toolCategories.find((c) => c.tools.some((t) => t.href === pathname))?.category ?? null;

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 24);
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownAreaRef.current && !dropdownAreaRef.current.contains(e.target as Node)) {
        setOpenCategory(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenCategory(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const isAuthed = status === "authenticated";
  const isLoading = status === "loading";

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-300 ${
          scrolled
            ? "bg-brand-cream/90 py-3 shadow-sm backdrop-blur-md"
            : "bg-transparent py-6"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- plain anchor is required so SmoothScroll's own click handler can smooth-scroll same-page, and fall back to a real navigation from other routes */}
          <a
            href="/#top"
            data-hover="true"
            className="shrink-0 text-lg font-bold tracking-tight text-brand-brown-dark"
          >
            PDF<span className="text-brand-blue">Genie</span>
          </a>

          <div ref={dropdownAreaRef} className="hidden min-w-0 flex-1 items-center justify-start gap-4 pl-8 xl:gap-6 xl:pl-10 lg:flex">
            {MARKETING_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                data-hover="true"
                className="group relative shrink-0 text-sm font-semibold text-brand-brown-dark"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-brand-blue transition-all duration-300 group-hover:w-full" />
              </a>
            ))}

            {!isAuthed && (
              <Link
                href="/admin/dashboard/login"
                data-hover="true"
                className="group relative shrink-0 text-sm font-semibold text-brand-brown-dark"
              >
                Admin
                <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-brand-blue transition-all duration-300 group-hover:w-full" />
              </Link>
            )}

            {toolCategories.map((category) => (
              <ToolDropdown
                key={category.category}
                category={category}
                isOpen={openCategory === category.category}
                isActive={category.category === activeCategory}
                activeHref={pathname}
                onToggle={() =>
                  setOpenCategory((c) => (c === category.category ? null : category.category))
                }
                onClose={() => setOpenCategory(null)}
              />
            ))}

            <SearchTools />
          </div>

          <div className="hidden shrink-0 items-center gap-5 lg:flex">
            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-full bg-brand-brown-dark/10" aria-label="Checking sign-in status" role="status" />
            ) : isAuthed ? (
              <UserMenu name={session?.user?.name} email={session?.user?.email} image={session?.user?.image} />
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
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
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
          <MobileMenu
            onClose={() => setMenuOpen(false)}
            isAuthed={isAuthed}
            userName={session?.user?.name}
            userEmail={session?.user?.email}
            userImage={session?.user?.image}
          />
        )}
      </AnimatePresence>
    </>
  );
}
