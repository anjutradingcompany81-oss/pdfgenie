"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type DeployStatus = {
  state: "idle" | "running" | "success" | "error";
  message: string;
  updatedAt?: string;
};

export function DeployPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<DeployStatus>({
    state: "idle",
    message: "Ready to deploy.",
  });
  const [triggering, setTriggering] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/admin/deploy/status", { cache: "no-store" });
      if (!res.ok) return;
      const data: DeployStatus = await res.json();
      setStatus(data);
      if (data.state === "success" || data.state === "error") {
        stopPolling();
      }
    }, 2000);
  }

  useEffect(() => stopPolling, []);

  async function handleDeploy() {
    setTriggering(true);
    try {
      const res = await fetch("/api/admin/deploy", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ state: "error", message: data.error || "Failed to start deploy" });
        return;
      }
      setStatus({ state: "running", message: "Deploy started…" });
      startPolling();
    } catch {
      setStatus({ state: "error", message: "Failed to start deploy" });
    } finally {
      setTriggering(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const isRunning = status.state === "running";

  return (
    <div className="mt-10 rounded-3xl border border-brand-brown-dark/10 bg-white p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-brand-brown-dark">Deploy latest version</h2>
          <p className="mt-1 text-sm text-brand-brown-dark/65">
            Rebuilds and restarts the live site from the code most recently pushed to the
            server.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="shrink-0 text-sm font-semibold text-brand-brown-dark/70 hover:text-brand-brown-dark"
        >
          Log out
        </button>
      </div>

      <button
        type="button"
        onClick={handleDeploy}
        disabled={triggering || isRunning}
        className="mt-6 w-full rounded-xl bg-brand-blue-deep py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {isRunning ? "Updating…" : "Update website"}
      </button>

      <p
        className={`mt-4 text-sm font-medium ${
          status.state === "error"
            ? "text-status-danger"
            : status.state === "success"
              ? "text-status-success"
              : "text-brand-brown-dark/70"
        }`}
      >
        {status.message}
      </p>
    </div>
  );
}
