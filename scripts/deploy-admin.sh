#!/bin/bash
# Triggered by the admin "Update website" button (see app/api/admin/deploy/route.ts).
# Builds whatever code is currently checked out in the work tree and restarts PM2.
# Getting new code into the work tree is a separate step (git push production main) —
# this script deliberately does not touch git, so it can't fight over the "main" ref
# with the push-to-deploy hook.
set -e

WORK_TREE="$(cd "$(dirname "$0")/.." && pwd)"
STATUS_FILE="$WORK_TREE/.deploy-status.json"
LOG_FILE="$WORK_TREE/.deploy-log.txt"

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

# Run via systemd-run (see route.ts) specifically so this process tree is
# NOT a descendant of the PM2-managed app. PM2 kills its whole process tree
# on restart/reload, which killed this script mid-flight, right at the
# `pm2 startOrReload` line, every time — since systemd-run's own stdout
# capture goes to the journal rather than a file we control, redirect
# everything ourselves instead.
exec >"$LOG_FILE" 2>&1

write_status() {
  printf '{"state":"%s","message":"%s","updatedAt":"%s"}' \
    "$1" "$2" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$STATUS_FILE"
}

trap 'write_status "error" "Deploy failed. Check .deploy-log.txt for details."' ERR

cd "$WORK_TREE"

# deploy-secrets.json is VPS-only (gitignored) and holds DATABASE_URL among
# other things — it's not part of this script's otherwise-minimal env (see
# route.ts), so pull just that one value out for the migrate step below.
if [ -f "$WORK_TREE/deploy-secrets.json" ]; then
  export DATABASE_URL="$(node -e "console.log(require('./deploy-secrets.json').DATABASE_URL || '')" 2>/dev/null)"
fi

write_status "running" "Installing dependencies"
npm ci --no-audit --no-fund

write_status "running" "Running database migrations"
if [ -n "$DATABASE_URL" ]; then
  npx prisma migrate deploy
else
  echo "DATABASE_URL not set — skipping migrations"
fi

write_status "running" "Building"
npm run build

write_status "running" "Assembling standalone output"
mkdir -p .next/standalone/.next
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

write_status "running" "Restarting app"
pm2 startOrReload ecosystem.config.js --env production

write_status "success" "Website updated successfully"
