"use client";

import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, resolveAutoTheme, type Theme, type ThemeSetting } from "@/lib/theme";

const OPTIONS: { value: ThemeSetting; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "creative-tim", label: "Creative Tim" },
  { value: "preline", label: "Preline" },
  { value: "auto", label: "Auto (rotates daily)" },
];

function readCookieSetting(): ThemeSetting {
  const match = document.cookie.match(/(?:^|;\s*)pdfgenie_theme=([^;]+)/);
  const value = match?.[1];
  if (value === "current" || value === "creative-tim" || value === "preline") return value;
  return "auto";
}

function applyTheme(setting: ThemeSetting) {
  const resolved: Theme = setting === "auto" ? resolveAutoTheme() : setting;
  document.documentElement.dataset.theme = resolved;
  document.cookie = `${THEME_COOKIE}=${setting}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function ThemeSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  // Lazy initializer: the "setting" value only affects rendering inside the
  // closed-by-default dropdown, so reading document.cookie here (undefined
  // during SSR, safely falls back to "auto") causes no hydration mismatch.
  const [setting, setSetting] = useState<ThemeSetting>(() =>
    typeof document !== "undefined" ? readCookieSetting() : "auto"
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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

  function pick(value: ThemeSetting) {
    applyTheme(value);
    setSetting(value);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-hover="true"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Change theme"
        className={
          variant === "dark"
            ? "flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-white/40"
            : "flex h-9 w-9 items-center justify-center rounded-full border border-brand-brown-dark/15 text-brand-brown-dark transition-colors hover:border-brand-blue/40 hover:text-brand-blue-deep"
        }
      >
        <Palette size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className={
            variant === "dark"
              ? "absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-white/15 bg-brand-blue-deep py-2 shadow-lg"
              : "absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-brand-brown-dark/10 bg-white py-2 shadow-lg"
          }
        >
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={setting === option.value}
              onClick={() => pick(option.value)}
              className={
                variant === "dark"
                  ? "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white/85 hover:bg-white/10"
                  : "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-brand-brown-dark hover:bg-brand-cream"
              }
            >
              <span className="flex w-4 shrink-0 items-center justify-center">
                {setting === option.value && (
                  <Check size={14} className={variant === "dark" ? "text-brand-blue-light" : "text-brand-blue-deep"} />
                )}
              </span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
