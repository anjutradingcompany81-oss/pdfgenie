// deploy-secrets.json holds ADMIN_USERNAME / ADMIN_PASSWORD_HASH / ADMIN_SESSION_SECRET.
// It lives only on the VPS (gitignored) — see scripts/hash-admin-password.mjs to generate it.
let secrets = {};
try {
  secrets = require("./deploy-secrets.json");
} catch {
  // Not present locally/in CI — admin routes simply stay unconfigured.
}

module.exports = {
  apps: [
    {
      name: "pdfgenie",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",
        ...secrets,
      },
    },
  ],
};
