// deploy-secrets.json holds ADMIN_USERNAME / ADMIN_PASSWORD_HASH / ADMIN_SESSION_SECRET.
// It lives only on the VPS (gitignored) — see scripts/hash-admin-password.mjs to generate it.
let secrets = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- PM2 loads this file as plain CommonJS
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
        // Next's standalone server.js chdir's to its own directory
        // (.next/standalone) at startup, so process.cwd() inside the running
        // app is NOT the project root. Anything that needs the real project
        // root (the admin deploy trigger, status file) must use this instead.
        PROJECT_ROOT: __dirname,
        ...secrets,
      },
    },
  ],
};
