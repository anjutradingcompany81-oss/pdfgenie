"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { allTools } from "@/lib/tools";

export function SearchTools({
  className = "",
  variant = "light",
  size = "sm",
  onNavigate,
}: {
  className?: string;
  variant?: "light" | "dark";
  size?: "sm" | "lg";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the actual filtering, not the input itself — the box stays
  // responsive to every keystroke, matches run 300ms after typing settles.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return allTools.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 8);
  }, [debouncedQuery]);
  // Clamped rather than reset via an effect keyed on `results` — avoids a
  // cascading render, and self-corrects the moment the list changes.
  const safeHighlighted = Math.min(highlighted, Math.max(results.length - 1, 0));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function closeAndClear() {
    setOpen(false);
    setQuery("");
    onNavigate?.();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[safeHighlighted];
      if (target) {
        closeAndClear();
        router.push(target.href);
      }
    }
  }

  const isDark = variant === "dark";
  const isLg = size === "lg";

  return (
    <div ref={containerRef} className={`relative min-w-0 shrink ${className}`}>
      <div
        className={`flex items-center gap-3 rounded-full border transition-colors ${
          isLg ? "px-6 py-4 shadow-lg shadow-brand-blue-deep/5" : "px-4 py-2"
        } ${
          isDark
            ? "border-white/25 bg-white/10 focus-within:border-white/50"
            : "border-brand-brown-dark/15 bg-white focus-within:border-brand-blue"
        }`}
      >
        <Search size={isLg ? 20 : 15} className={`shrink-0 ${isDark ? "text-white/50" : "text-brand-brown-dark/40"}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isLg ? "Search for a tool… (merge, compress, sign, convert…)" : "Search tools…"}
          aria-label="Search tools"
          aria-expanded={open && results.length > 0}
          aria-haspopup="listbox"
          role="combobox"
          aria-controls="tool-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          className={`w-full min-w-0 bg-transparent focus:outline-none ${
            isLg ? "text-base sm:text-lg" : "text-sm lg:w-24 xl:w-40"
          } ${
            isDark ? "text-white placeholder:text-white/40" : "text-brand-brown-dark placeholder:text-brand-brown-dark/40"
          }`}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X size={isLg ? 18 : 13} className={isDark ? "text-white/50 hover:text-white" : "text-brand-brown-dark/40 hover:text-brand-brown-dark"} />
          </button>
        )}
      </div>

      {open && query && (
        <div
          id="tool-search-results"
          role="listbox"
          className={`absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-brand-brown-dark/10 bg-white py-2 shadow-lg ${
            isLg ? "left-0 right-0" : "right-0 w-72"
          }`}
        >
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-brand-brown-dark/50">No tools found for &quot;{query}&quot;.</p>
          ) : (
            results.map((t, i) => (
              <Link
                key={t.href}
                href={t.href}
                role="option"
                aria-selected={i === safeHighlighted}
                onClick={closeAndClear}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-brown-dark transition-colors ${
                  i === safeHighlighted ? "bg-brand-cream" : "hover:bg-brand-cream"
                }`}
              >
                <t.icon size={15} className="shrink-0 text-brand-blue-deep" />
                {t.title}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
