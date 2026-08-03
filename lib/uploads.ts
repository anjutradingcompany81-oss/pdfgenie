import { mkdir, readdir, stat } from "fs/promises";
import path from "path";

// Next's standalone server.js chdir's into .next/standalone at startup, and
// that directory's public/ folder is wiped and recopied on every deploy —
// so uploads can't live under process.cwd()/public. PROJECT_ROOT (set in
// ecosystem.config.js) points at the persistent checkout instead; uploaded
// files are served back out through app/api/uploads/avatars/[filename].
const UPLOADS_ROOT = path.join(process.env.PROJECT_ROOT || process.cwd(), "uploads");

export const AVATARS_DIR = path.join(UPLOADS_ROOT, "avatars");

// Every other tool in the app processes PDFs entirely client-side and never
// uploads anything. Signature Requests is the one exception — a shareable
// signing link only works if the file lives somewhere the recipient's
// browser can fetch it from — so it gets its own uploads subdirectory.
export const SIGNATURE_REQUESTS_DIR = path.join(UPLOADS_ROOT, "signature-requests");

export async function ensureAvatarsDir(): Promise<void> {
  await mkdir(AVATARS_DIR, { recursive: true });
}

export async function ensureSignatureRequestsDir(): Promise<void> {
  await mkdir(SIGNATURE_REQUESTS_DIR, { recursive: true });
}

async function dirSizeBytes(dir: string): Promise<number> {
  try {
    const files = await readdir(dir);
    const sizes = await Promise.all(
      files.map(async (file) => (await stat(path.join(dir, file))).size)
    );
    return sizes.reduce((sum, size) => sum + size, 0);
  } catch {
    return 0;
  }
}

/** Total bytes used by everything this app stores server-side: avatars and signature-request PDFs. */
export async function getUploadsStorageBytes(): Promise<number> {
  const [avatars, signatureRequests] = await Promise.all([
    dirSizeBytes(AVATARS_DIR),
    dirSizeBytes(SIGNATURE_REQUESTS_DIR),
  ]);
  return avatars + signatureRequests;
}
