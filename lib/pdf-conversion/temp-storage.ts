import { mkdir, readdir, rm, stat, writeFile } from "fs/promises";
import os from "os";
import path from "path";

// Conversion files are short-lived (deleted within FILE_RETENTION_MINUTES,
// or immediately after download) and never need to survive a deploy, unlike
// lib/uploads.ts's persistent avatars/signature-request storage — so these
// live under the OS temp directory, not the project's uploads/ folder.
const CONVERSIONS_ROOT = path.join(os.tmpdir(), "pdfgenie", "conversions");

function jobDir(jobId: string): string {
  // jobId is always a server-generated UUID (see crypto.randomUUID() at the
  // call site) — never derived from user input — so this can't be used for
  // path traversal.
  return path.join(CONVERSIONS_ROOT, jobId);
}

export async function ensureJobDir(jobId: string): Promise<string> {
  const dir = jobDir(jobId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function writeJobInput(jobId: string, bytes: Uint8Array): Promise<string> {
  const dir = await ensureJobDir(jobId);
  const filePath = path.join(dir, "input.pdf");
  await writeFile(filePath, bytes);
  return filePath;
}

export async function writeJobOutput(jobId: string, bytes: Uint8Array, extension: "docx" | "xlsx"): Promise<string> {
  const dir = await ensureJobDir(jobId);
  const filePath = path.join(dir, `output.${extension}`);
  await writeFile(filePath, bytes);
  return filePath;
}

export async function deleteJobDir(jobId: string): Promise<void> {
  await rm(jobDir(jobId), { recursive: true, force: true });
}

function getRetentionMs(): number {
  const minutes = Number(process.env.FILE_RETENTION_MINUTES) || 30;
  return minutes * 60 * 1000;
}

/** Deletes any job directory older than the retention window — a safety net for jobs that failed before their own cleanup ran, or were never downloaded. */
export async function cleanupExpiredJobDirs(): Promise<void> {
  const retentionMs = getRetentionMs();
  let entries: string[];
  try {
    entries = await readdir(CONVERSIONS_ROOT);
  } catch {
    return; // directory doesn't exist yet — nothing to clean up
  }

  await Promise.all(
    entries.map(async (entry) => {
      const dirPath = path.join(CONVERSIONS_ROOT, entry);
      try {
        const info = await stat(dirPath);
        if (info.isDirectory() && Date.now() - info.mtimeMs > retentionMs) {
          await rm(dirPath, { recursive: true, force: true });
        }
      } catch {
        // Ignore races where the directory disappeared between readdir and stat.
      }
    })
  );
}
