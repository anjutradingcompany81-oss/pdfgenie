import type { ConversionErrorCode, ConversionJobRecord, ConversionStage, ConversionTargetFormat } from "./types";

/**
 * In-memory job registry, matching the same pattern as lib/rate-limit.ts's
 * Map-based throttle store. The VPS runs a single PM2 process, so this is
 * fine — a real multi-instance deployment would need this backed by Redis
 * instead, but that's infrastructure this project doesn't currently have
 * and shouldn't gain just for this one feature (see lib/pdf-conversion's
 * design notes).
 */
const jobs = new Map<string, ConversionJobRecord>();

export function createJob(id: string, targetFormat: ConversionTargetFormat, originalFileName: string, ttlMs: number): ConversionJobRecord {
  const now = Date.now();
  const job: ConversionJobRecord = {
    id,
    targetFormat,
    originalFileName,
    stage: "uploading",
    errorMessage: null,
    errorCode: null,
    resultPath: null,
    resultMimeType: null,
    createdAt: now,
    expiresAt: now + ttlMs,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): ConversionJobRecord | undefined {
  return jobs.get(id);
}

export function updateJobStage(id: string, stage: ConversionStage): void {
  const job = jobs.get(id);
  if (job) job.stage = stage;
}

export function markJobFailed(id: string, code: ConversionErrorCode, message: string): void {
  const job = jobs.get(id);
  if (!job) return;
  job.stage = "failed";
  job.errorCode = code;
  job.errorMessage = message;
}

export function markJobCompleted(id: string, resultPath: string, resultMimeType: string): void {
  const job = jobs.get(id);
  if (!job) return;
  job.stage = "completed";
  job.resultPath = resultPath;
  job.resultMimeType = resultMimeType;
}

export function deleteJob(id: string): void {
  jobs.delete(id);
}

/** Sweeps jobs whose TTL has passed — called opportunistically rather than on a timer, since conversion traffic on this site is low. */
export function sweepExpiredJobs(): string[] {
  const now = Date.now();
  const expired: string[] = [];
  for (const [id, job] of jobs) {
    if (job.expiresAt < now) {
      expired.push(id);
      jobs.delete(id);
    }
  }
  return expired;
}
