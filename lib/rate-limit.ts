const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(key: string): void {
  attempts.delete(key);
}

const throttleBuckets = new Map<string, { count: number; resetAt: number }>();

/**
 * General-purpose request throttle — counts every call, not just failures.
 * Used for compute-heavy routes (ffmpeg, self-hosted ML) where the request
 * itself (success or not) consumes real CPU/RAM on the VPS, so a handful of
 * concurrent requests from one IP is enough to starve every other visitor.
 * Returns true if the request should be rejected with a 429.
 */
export function isThrottled(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = throttleBuckets.get(key);
  if (!entry || entry.resetAt < now) {
    throttleBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= maxRequests) return true;
  entry.count += 1;
  return false;
}

/** Best-effort client IP from the nginx-forwarded header, matching the pattern used by admin/login. */
export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
