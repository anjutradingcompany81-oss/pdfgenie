import { randomUUID } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "pdfgenie_anon_id";
const MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

/**
 * Identifies an anonymous (non-logged-in) visitor for free-plan usage
 * limits only — never used for anything else, and unrelated to the
 * Auth.js session cookie. httpOnly + a random UUID means it can't be read
 * or forged client-side; it can still be reset by clearing cookies, which
 * is an accepted soft limit for a free-tier gate, not a security boundary.
 */
export async function getOrCreateAnonymousId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}
