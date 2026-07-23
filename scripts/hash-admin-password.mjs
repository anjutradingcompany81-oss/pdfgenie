// Generates an ADMIN_PASSWORD_HASH value for the admin login.
// Usage: node scripts/hash-admin-password.mjs '<password>'
// Output goes into deploy-secrets.json on the server — never commit the result.
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-admin-password.mjs '<password>'");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`${salt}:${hash}`);
