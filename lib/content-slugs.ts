// Split out from content-pages.ts so Client Components (the admin content
// editor's tab list) can import just this — content-pages.ts pulls in
// lib/db.ts, and therefore the Postgres driver, which can't be bundled for
// the browser.
export const CONTENT_SLUGS = ["faq", "privacy-policy", "terms", "contact", "about"] as const;
export type ContentSlug = (typeof CONTENT_SLUGS)[number];
