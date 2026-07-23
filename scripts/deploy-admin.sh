#!/bin/bash
# Triggered by the admin "Update website" button (see app/api/admin/deploy/route.ts).
# Pulls the latest reviewed code from GitHub main, rebuilds, and restarts PM2.
set -e

WORK_TREE="$(cd "$(dirname "$0")/.." && pwd)"
BARE_REPO="${PDFGENIE_BARE_REPO:-/root/pdfgenie.git}"
STATUS_FILE="$WORK_TREE/.deploy-status.json"

write_status() {
  printf '{"state":"%s","message":"%s","updatedAt":"%s"}' \
    "$1" "$2" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$STATUS_FILE"
}

trap 'write_status "error" "Deploy failed. Check server logs for details."' ERR

cd "$WORK_TREE"

write_status "running" "Fetching latest code from GitHub"
GIT_DIR="$BARE_REPO" GIT_WORK_TREE="$WORK_TREE" git fetch github main
GIT_DIR="$BARE_REPO" GIT_WORK_TREE="$WORK_TREE" git reset --hard github/main

write_status "running" "Installing dependencies"
npm install --no-audit --no-fund

write_status "running" "Building"
npm run build

write_status "running" "Assembling standalone output"
mkdir -p .next/standalone/.next
rm -rf .next/standalone/public .next/standalone/.next/static
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

write_status "running" "Restarting app"
pm2 restart pdfgenie

write_status "success" "Website updated successfully"
