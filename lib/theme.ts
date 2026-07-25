export const THEMES = ["current", "creative-tim", "preline"] as const;
export type Theme = (typeof THEMES)[number];
export type ThemeSetting = Theme | "auto";

export const THEME_COOKIE = "pdfgenie_theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months, matches lib/anonymous-id.ts

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

// Fixed instant = 2025-01-01 12:00:00 IST, expressed directly in UTC (IST is UTC+5:30,
// no DST) so the daily rotation needs no timezone/calendar library — just integer
// day-floor math against this epoch.
const EPOCH_UTC_MS = Date.UTC(2025, 0, 1, 6, 30, 0);
const MS_PER_DAY = 86_400_000;

/**
 * Deterministic daily theme rotation, changing at exactly 12:00 IST — the same
 * instant for every visitor, not per-visitor local time.
 */
export function resolveAutoTheme(now: Date = new Date()): Theme {
  const daysSinceEpoch = Math.floor((now.getTime() - EPOCH_UTC_MS) / MS_PER_DAY);
  const index = ((daysSinceEpoch % THEMES.length) + THEMES.length) % THEMES.length;
  return THEMES[index];
}

/** Resolves the effective theme from a (possibly absent/invalid) cookie value, falling back to the daily rotation for both a missing cookie and an explicit "auto". */
export function resolveTheme(cookieValue: string | undefined, now: Date = new Date()): Theme {
  if (cookieValue && isTheme(cookieValue)) return cookieValue;
  return resolveAutoTheme(now);
}

/**
 * Plain-JS mirror of resolveTheme()/resolveAutoTheme() above, run as a
 * next/script `beforeInteractive` inline script in app/layout.tsx. This sets
 * data-theme on <html> before first paint without a server-side cookies()
 * read, which would force every page in the app out of static rendering.
 * Keep this string's formula in sync with the TS functions above by hand —
 * it can't literally import them since it must ship as inline page text.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
  var m=document.cookie.match(/(?:^|; )pdfgenie_theme=([^;]+)/);
  var v=m?decodeURIComponent(m[1]):"auto";
  var THEMES=["current","creative-tim","preline"];
  var theme;
  if(v==="current"||v==="creative-tim"||v==="preline"){theme=v;}
  else{
    var EPOCH=Date.UTC(2025,0,1,6,30,0);
    var days=Math.floor((Date.now()-EPOCH)/86400000);
    var idx=((days%3)+3)%3;
    theme=THEMES[idx];
  }
  document.documentElement.setAttribute("data-theme",theme);
}catch(e){}})();`;
