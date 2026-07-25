import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// A signed-in user's SMTP password is now persisted (see SmtpCredential in
// prisma/schema.prisma) so they don't have to re-enter it every job. It's
// stored as AES-256-GCM ciphertext, never plaintext — this key is the only
// thing that can reverse it, and it lives only in deploy-secrets.json on the
// VPS (gitignored), spread into ecosystem.config.js the same way
// ADMIN_SESSION_SECRET is (see lib/admin-auth.ts for the same guard pattern).
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const secret = process.env.SMTP_CREDENTIAL_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("SMTP_CREDENTIAL_ENCRYPTION_KEY is not configured");
  }
  cachedKey = scryptSync(secret, "pdfgenie-smtp-credential", 32);
  return cachedKey;
}

// Encoded as "iv.authTag.ciphertext", each segment base64.
export function encryptSmtpPassword(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((buf) => buf.toString("base64")).join(".");
}

export function decryptSmtpPassword(encoded: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encoded.split(".");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted SMTP password.");
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function smtpCredentialsConfigured(): boolean {
  return Boolean(process.env.SMTP_CREDENTIAL_ENCRYPTION_KEY);
}
