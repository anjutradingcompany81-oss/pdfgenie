import { mkdir, readdir, stat } from "fs/promises";
import path from "path";

// Next's standalone server.js chdir's into .next/standalone at startup, and
// that directory's public/ folder is wiped and recopied on every deploy —
// so uploads can't live under process.cwd()/public. PROJECT_ROOT (set in
// ecosystem.config.js) points at the persistent checkout instead; uploaded
// files are served back out through app/api/uploads/avatars/[filename].
const UPLOADS_ROOT = path.join(process.env.PROJECT_ROOT || process.cwd(), "uploads");

export const AVATARS_DIR = path.join(UPLOADS_ROOT, "avatars");

export async function ensureAvatarsDir(): Promise<void> {
  await mkdir(AVATARS_DIR, { recursive: true });
}

/** Total bytes used by uploaded avatars — the only files this app stores. */
export async function getUploadsStorageBytes(): Promise<number> {
  try {
    const files = await readdir(AVATARS_DIR);
    const sizes = await Promise.all(
      files.map(async (file) => (await stat(path.join(AVATARS_DIR, file))).size)
    );
    return sizes.reduce((sum, size) => sum + size, 0);
  } catch {
    return 0;
  }
}
