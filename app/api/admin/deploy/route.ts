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

  const scriptPath = path.join(process.cwd(), "scripts", "deploy-admin.sh");
  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json({ error: "Deploy script not found" }, { status: 500 });
  }

  writeDeployStatus({ state: "running", message: "Deploy queued…" });

  const logFd = fs.openSync(path.join(process.cwd(), ".deploy-log.txt"), "w");

  const child = spawn("bash", [scriptPath], {
    cwd: process.cwd(),
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });
  fs.closeSync(logFd);

  child.on("error", (err) => {
    writeDeployStatus({ state: "error", message: `Failed to start deploy: ${err.message}` });
  });

  child.unref();

  return NextResponse.json({ ok: true });
}
