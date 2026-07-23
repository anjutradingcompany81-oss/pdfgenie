/**
 * Fire-and-forget usage ping — never blocks or fails the tool's actual
 * operation. Only the tool slug is sent (see app/api/analytics/track).
 */
export function trackToolUsage(toolSlug: string): void {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toolSlug }),
    keepalive: true,
  }).catch(() => {});
}
