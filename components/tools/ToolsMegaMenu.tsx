"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toolCategories } from "@/lib/tools";

export function ToolsMegaMenu({ activeHref }: { activeHref?: string | null }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = toolCategories.some((c) => c.tools.some((t) => t.href === activeHref));

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
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

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        data-hover="true"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-current={isActive ? "true" : undefined}
        className={`group relative flex items-center gap-1 text-sm font-semibold transition-colors ${
          open || isActive ? "text-brand-blue-deep" : "text-brand-brown-dark hover:text-brand-blue-deep"
        }`}
      >
        Tools
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        <span
          className={`absolute -bottom-1 left-0 h-[2px] bg-brand-blue transition-all duration-300 ${
            isActive ? "w-full" : "w-0 group-hover:w-full"
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Tools"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 top-full z-50 mt-3 grid w-[min(92vw,880px)] -translate-x-1/2 grid-cols-2 gap-x-8 gap-y-6 rounded-2xl border border-brand-brown-dark/10 bg-white p-6 shadow-lg sm:grid-cols-4"
          >
            {toolCategories.map((category) => (
              <div key={category.category}>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue-deep">
                  {category.category}
                </p>
                <div className="mt-3 space-y-0.5">
                  {category.tools.map((t) => (
                    <Link
                      key={t.href}
                      href={t.href}
                      role="menuitem"
                      aria-current={t.href === activeHref ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-brand-cream ${
                        t.href === activeHref ? "font-semibold text-brand-blue-deep" : "text-brand-brown-dark/85"
                      }`}
                    >
                      <t.icon size={14} className="shrink-0 text-brand-blue-deep/70" />
                      {t.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
