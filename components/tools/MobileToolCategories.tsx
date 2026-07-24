"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ToolCategory } from "@/lib/tools";

export function MobileToolCategories({
  categories,
  activeHref,
  onNavigate,
}: {
  categories: ToolCategory[];
  activeHref?: string | null;
  onNavigate: () => void;
}) {
  const activeCategory = categories.find((c) => c.tools.some((t) => t.href === activeHref))?.category ?? null;
  const [openCategory, setOpenCategory] = useState<string | null>(activeCategory);

  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const isOpen = openCategory === category.category;
        const isActive = category.category === activeCategory;
        return (
          <div key={category.category}>
            <button
              type="button"
              onClick={() => setOpenCategory(isOpen ? null : category.category)}
              aria-expanded={isOpen}
              aria-current={isActive ? "true" : undefined}
              className={`flex w-full items-center justify-between py-2.5 text-left text-xl font-bold tracking-tight ${
                isActive ? "text-brand-blue-light" : "text-white"
              }`}
            >
              {category.category}
              <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pl-1"
              >
                {category.tools.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    onClick={onNavigate}
                    aria-current={t.href === activeHref ? "page" : undefined}
                    className={`flex items-center gap-2.5 py-2 text-base font-medium ${
                      t.href === activeHref ? "text-white" : "text-white/85"
                    }`}
                  >
                    <t.icon size={16} className="shrink-0" />
                    {t.title}
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
