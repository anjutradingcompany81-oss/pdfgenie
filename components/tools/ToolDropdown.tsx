"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { ToolCategory } from "@/lib/tools";

export function ToolDropdown({
  category,
  isOpen,
  onToggle,
  onClose,
}: {
  category: ToolCategory;
  isOpen: boolean;
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
        className={`flex items-center gap-1 text-sm font-semibold transition-colors ${
          isOpen ? "text-brand-blue-deep" : "text-brand-brown-dark hover:text-brand-blue-deep"
        }`}
      >
        {category.category}
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
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
                onClick={onClose}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-brown-dark transition-colors hover:bg-brand-cream"
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
