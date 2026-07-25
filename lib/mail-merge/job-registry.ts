import type { MailMergeAttachment, TransientSmtpConfig } from "@/lib/mail-merge/send-job";

/**
 * Bridges the two things a live send deliberately never persists — the
 * uploaded attachment buffers and the transient SMTP credentials — across
 * the /start, /batch, /pause, /resume, /cancel request lifecycle of one
 * job. Everything else needed to resume (subject/body/per-recipient
 * fields) already lives on MailMergeJob/MailMergeRecipient in the DB.
 *
 * Module-level Map, same single-process assumption as lib/rate-limit.ts's
 * in-memory throttle maps — this app runs one PM2 process, no cluster
 * mode, so there's no cross-process consistency concern here.
 */
type RegistryEntry = {
  attachments: MailMergeAttachment[];
  smtpConfig?: TransientSmtpConfig;
  lastAccessedAt: number;
};

const registry = new Map<string, RegistryEntry>();

const IDLE_TTL_MS = 45 * 60 * 1000;
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

function sweep() {
  const now = Date.now();
  for (const [jobId, entry] of registry) {
    if (now - entry.lastAccessedAt > IDLE_TTL_MS) registry.delete(jobId);
  }
}

let sweepTimer: ReturnType<typeof setInterval> | null = null;
function ensureSweeping() {
  if (sweepTimer) return;
  sweepTimer = setInterval(sweep, SWEEP_INTERVAL_MS);
  sweepTimer.unref?.();
}

export function registerJob(jobId: string, attachments: MailMergeAttachment[], smtpConfig?: TransientSmtpConfig): void {
  ensureSweeping();
  registry.set(jobId, { attachments, smtpConfig, lastAccessedAt: Date.now() });
}

export function getJobEntry(jobId: string): RegistryEntry | undefined {
  const entry = registry.get(jobId);
  if (entry) entry.lastAccessedAt = Date.now();
  return entry;
}

export function hasJobEntry(jobId: string): boolean {
  return registry.has(jobId);
}

export function evictJob(jobId: string): void {
  registry.delete(jobId);
}
