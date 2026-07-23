#!/bin/bash
# Triggered by the admin "Update website" button (see app/api/admin/deploy/route.ts).
# Builds whatever code is currently checked out in the work tree and restarts PM2.
# Getting new code into the work tree is a separate step (git push production main) —
# this script deliberately does not touch git, so it can't fight over the "main" ref
# with the push-to-deploy hook.
set -e

WORK_TREE="$(cd "$(dirname "$0")/.." && pwd)"
STATUS_FILE="$WORK_TREE/.deploy-status.json"

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

# Spawned as a child of the PM2-managed app, this inherits NODE_ENV=production
# from ecosystem.config.js. That makes `npm install` prune devDependencies
# (typescript, tailwind, etc.), which next build needs. Unset it here; next
# build sets its own production mode internally regardless.
unset NODE_ENV

write_status() {
  printf '{"state":"%s","message":"%s","updatedAt":"%s"}' \
    "$1" "$2" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$STATUS_FILE"
}

trap 'write_status "error" "Deploy failed. Check .deploy-log.txt for details."' ERR

cd "$WORK_TREE"

write_status "running" "Installing dependencies"
npm ci --no-audit --no-fund

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
