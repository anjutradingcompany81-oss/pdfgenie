"use client";

import Link from "next/link";
import { AlertTriangle, Ban, CheckCircle2, Download, Loader2, Pause, Play, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Counts = { PENDING: number; SENT: number; FAILED: number; CANCELLED: number };

const POLL_INTERVAL_MS = 400;

async function postJson(url: string) {
  const res = await fetch(url, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function SendProgress({ jobId, total }: { jobId: string; total: number }) {
  const [counts, setCounts] = useState<Counts>({ PENDING: total, SENT: 0, FAILED: 0, CANCELLED: 0 });
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const [registryLost, setRegistryLost] = useState(false);
  const [busy, setBusy] = useState(false); // pause/resume/cancel button in flight
  // Recomputed each poll tick (inside the effect, not during render) from
  // Date.now() — an impure read, which is fine in an effect but not allowed
  // directly in the render body.
  const [rateInfo, setRateInfo] = useState<{ rate: number; etaSec: number | null }>({ rate: 0, etaSec: null });

  const startedAtRef = useRef<number | null>(null);
  const stoppedRef = useRef(false); // unmount guard

  useEffect(() => {
    stoppedRef.current = false;
    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (stoppedRef.current) return;
      try {
        const res = await fetch(`/api/mail-merge/jobs/${jobId}/batch`, { method: "POST" });
        if (res.status === 409) {
          const data = await res.json().catch(() => ({}));
          if (data.code === "REGISTRY_LOST") {
            setRegistryLost(true);
            setPaused(true);
            return; // stop polling — nothing more this tab can do
          }
        }
        const data = await res.json();
        if (stoppedRef.current) return;
        if (data.counts) {
          setCounts(data.counts);
          const processed = data.counts.SENT + data.counts.FAILED + data.counts.CANCELLED;
          const elapsedSec = Math.max(1, (Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
          const rate = processed / elapsedSec;
          const remaining = total - processed;
          setRateInfo({ rate, etaSec: rate > 0 ? Math.round(remaining / rate) : null });
        }
        if (data.paused) {
          setPaused(true);
          return; // stop polling while paused; Resume restarts the loop
        }
        if (data.done) {
          setDone(true);
          return;
        }
      } catch {
        // transient network error — keep polling
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS);
    }

    tick();
    return () => {
      stoppedRef.current = true;
      if (timer) clearTimeout(timer);
    };
    // Re-runs whenever `paused` flips back to false (Resume), restarting the loop.
  }, [jobId, paused, total]);

  const processed = counts.SENT + counts.FAILED + counts.CANCELLED;
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  const remaining = total - processed;
  const { rate, etaSec } = rateInfo;

  async function handlePause() {
    setBusy(true);
    try {
      const { ok } = await postJson(`/api/mail-merge/jobs/${jobId}/pause`);
      if (ok) setPaused(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleResume() {
    setBusy(true);
    try {
      const { ok, data } = await postJson(`/api/mail-merge/jobs/${jobId}/resume`);
      if (ok) {
        setRegistryLost(false);
        setPaused(false); // triggers the poll effect to restart
      } else if (data.code === "REGISTRY_LOST") {
        setRegistryLost(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      const { ok } = await postJson(`/api/mail-merge/jobs/${jobId}/cancel`);
      if (ok) {
        setDone(true);
        setPaused(false);
        setCounts((c) => ({ ...c, CANCELLED: c.CANCELLED + c.PENDING, PENDING: 0 }));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-card rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-5">
      <div className="flex items-center justify-between text-sm font-semibold text-brand-brown-dark">
        <span>
          {done ? "Finished" : paused ? "Paused" : "Sending…"} — {processed} / {total}
        </span>
        <span className="font-mono text-xs text-brand-brown-dark/70">{pct}%</span>
      </div>

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            done ? "bg-status-success" : "bg-brand-blue-deep"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-brand-brown-dark/70">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-status-success" /> {counts.SENT} sent
        </span>
        <span className="flex items-center gap-1">
          <XCircle size={12} className="text-status-danger" /> {counts.FAILED} failed
        </span>
        {counts.CANCELLED > 0 && (
          <span className="flex items-center gap-1">
            <Ban size={12} className="text-brand-brown-dark/50" /> {counts.CANCELLED} cancelled
          </span>
        )}
        {!done && etaSec !== null && remaining > 0 && (
          <span>
            ~{Math.max(0, Math.round(rate * 60))} / min · ETA {etaSec < 60 ? `${etaSec}s` : `${Math.ceil(etaSec / 60)}m`}
          </span>
        )}
      </div>

      {registryLost && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-status-warning/30 bg-status-warning/10 p-3 text-xs text-brand-brown-dark">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-status-warning" />
          <span>
            The server restarted (or this job sat idle too long) and lost its in-memory attachment/SMTP
            state, so this tab can&apos;t resume it directly. Open the job&apos;s{" "}
            <Link href={`/tools/mail-merge/history/${jobId}`} className="font-semibold underline">
              history page
            </Link>{" "}
            and use Retry (re-attaching PDFs if needed) to finish the remaining recipients.
          </span>
        </div>
      )}

      {!done && (
        <div className="mt-4 flex flex-wrap gap-2">
          {!paused ? (
            <button
              type="button"
              onClick={handlePause}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full border border-brand-brown-dark/15 px-4 py-2 text-xs font-semibold text-brand-brown-dark disabled:opacity-60"
            >
              <Pause size={13} />
              Pause
            </button>
          ) : (
            !registryLost && (
              <button
                type="button"
                onClick={handleResume}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-full bg-brand-blue-deep px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                Resume
              </button>
            )
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full border border-status-danger/30 px-4 py-2 text-xs font-semibold text-status-danger disabled:opacity-60"
          >
            <Ban size={13} />
            Cancel remaining
          </button>
        </div>
      )}

      {done && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/tools/mail-merge/history/${jobId}`}
            className="flex items-center gap-1.5 rounded-full bg-brand-blue-deep px-4 py-2 text-xs font-semibold text-white"
          >
            View delivery dashboard
          </Link>
          <a
            href={`/api/mail-merge/jobs/${jobId}/log?format=xlsx`}
            className="flex items-center gap-1.5 rounded-full border border-brand-brown-dark/15 px-4 py-2 text-xs font-semibold text-brand-brown-dark"
          >
            <Download size={13} />
            Download log
          </a>
        </div>
      )}
    </div>
  );
}
