export const TOOL_USED_EVENT = "pdfgenie:tool-used";

/**
 * Fire-and-forget: records one tool use against today's quota, then
 * broadcasts the fresh status so any mounted ToolShell can react
 * immediately (e.g. lock further use mid-session) without a page reload.
 */
export function recordToolUsage(): void {
  fetch("/api/usage/tool-record", { method: "POST" })
    .then((res) => res.json())
    .then((status) => {
      window.dispatchEvent(new CustomEvent(TOOL_USED_EVENT, { detail: status }));
    })
    .catch(() => {});
}
