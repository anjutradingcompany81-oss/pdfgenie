import fs from "fs";
import path from "path";

export type DeployState = "idle" | "running" | "success" | "error";

export type DeployStatus = {
  state: DeployState;
  message: string;
  updatedAt?: string;
};

const STATUS_FILE = path.join(process.cwd(), ".deploy-status.json");

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
