import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getAdminSession } from "@/lib/admin-auth";
import { readDeployStatus, writeDeployStatus } from "@/lib/deploy-status";

export async function POST() {
  const authed = await getAdminSession();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (readDeployStatus().state === "running") {
    return NextResponse.json({ error: "A deploy is already running" }, { status: 409 });
  }

  // process.cwd() is NOT the project root here — Next's standalone server.js
  // chdir's to .next/standalone at startup. Use the explicit env var set in
  // ecosystem.config.js instead.
  const projectRoot = process.env.PROJECT_ROOT;
  if (!projectRoot) {
    return NextResponse.json({ error: "PROJECT_ROOT is not configured" }, { status: 500 });
  }

  const scriptPath = path.join(projectRoot, "scripts", "deploy-admin.sh");
  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json({ error: "Deploy script not found" }, { status: 500 });
  }

  writeDeployStatus({ state: "running", message: "Deploy queued…" });

  const logFd = fs.openSync(path.join(projectRoot, ".deploy-log.txt"), "w");

  // Don't inherit the running app's full environment: it carries internal
  // Next.js runtime state (TURBOPACK, __NEXT_PRIVATE_*) and PM2 bookkeeping
  // vars that confuse a nested `next build`. Give the child a clean slate.
  const child = spawn("bash", [scriptPath], {
    cwd: projectRoot,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      USER: process.env.USER,
      PROJECT_ROOT: projectRoot,
      // Explicitly not "production" — npm prunes devDependencies (needed to
      // run `next build`) when NODE_ENV=production during install.
      NODE_ENV: "development",
    },
  });
  fs.closeSync(logFd);

  child.on("error", (err) => {
    writeDeployStatus({ state: "error", message: `Failed to start deploy: ${err.message}` });
  });

  child.unref();

  return NextResponse.json({ ok: true });
}
