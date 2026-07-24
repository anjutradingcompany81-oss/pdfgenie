"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ToolCategory } from "@/lib/tools";

export function ToolDropdown({
  category,
  isOpen,
  isActive = false,
  activeHref,
  onToggle,
  onClose,
}: {
  category: ToolCategory;
  isOpen: boolean;
  /** True when the page you're currently on belongs to this category. */
  isActive?: boolean;
  activeHref?: string;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        data-hover="true"
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-current={isActive ? "true" : undefined}
        className={`group relative flex items-center gap-1 text-sm font-semibold transition-colors ${
          isOpen || isActive ? "text-brand-blue-deep" : "text-brand-brown-dark hover:text-brand-blue-deep"
        }`}
      >
        {category.category}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        <span
          className={`absolute -bottom-1 left-0 h-[2px] bg-brand-blue transition-all duration-300 ${
            isActive ? "w-full" : "w-0 group-hover:w-full"
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            aria-label={category.category}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-brand-brown-dark/10 bg-white py-2 shadow-lg"
          >
            {category.tools.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                role="menuitem"
                aria-current={t.href === activeHref ? "page" : undefined}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-brand-cream ${
                  t.href === activeHref ? "bg-brand-cream font-semibold text-brand-blue-deep" : "text-brand-brown-dark"
                }`}
              >
                <t.icon size={15} className="shrink-0 text-brand-blue-deep" />
                {t.title}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
