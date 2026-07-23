import fs from "fs";
import path from "path";

export type DeployState = "idle" | "running" | "success" | "error";

export type DeployStatus = {
  state: DeployState;
  message: string;
  updatedAt?: string;
};

// process.cwd() is NOT the project root here — Next's standalone server.js
// chdir's to .next/standalone at startup. Use the explicit env var set in
// ecosystem.config.js instead.
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();
const STATUS_FILE = path.join(PROJECT_ROOT, ".deploy-status.json");

export function readDeployStatus(): DeployStatus {
  try {
    const raw = fs.readFileSync(STATUS_FILE, "utf8");
    return JSON.parse(raw) as DeployStatus;
  } catch {
    return { state: "idle", message: "Ready to deploy." };
  }
}

export function writeDeployStatus(status: Omit<DeployStatus, "updatedAt">): void {
  const payload: DeployStatus = {
    ...status,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(payload));
}
