"use client";

import Link from "next/link";
import { History, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";

type Job = {
  id: string;
  status: string;
  subject: string;
  senderEmail: string | null;
  recipientCount: number;
  createdAt: string;
  user: { email: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-status-success/10 text-status-success",
  FAILED: "bg-status-danger/10 text-status-danger",
  SENDING: "bg-status-warning/10 text-status-warning",
  PENDING: "bg-brand-brown-dark/5 text-brand-brown-dark/70",
  BLOCKED: "bg-status-danger/10 text-status-danger",
  PAUSED: "bg-status-warning/10 text-status-warning",
  CANCELLED: "bg-brand-brown-dark/5 text-brand-brown-dark/70",
};

export default function MailMergeHistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function load() {
    const params = new URLSearchParams();
    if (jobId) params.set("jobId", jobId);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    fetch(`/api/mail-merge/jobs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(() => {});
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToolShell
      icon={History}
      title="Mail Merge — Audit trail"
      description="Every mail merge job, searchable and filterable, with logs and reports."
    >
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-brand-brown-dark/10 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-brown-dark">Job ID</label>
          <input
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="rounded-full border border-brand-brown-dark/15 px-3 py-1.5 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-brown-dark">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-full border border-brand-brown-dark/15 px-3 py-1.5 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
          >
            <option value="">Any</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="SENDING">Sending</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-brown-dark">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-full border border-brand-brown-dark/15 px-3 py-1.5 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-brand-brown-dark">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-full border border-brand-brown-dark/15 px-3 py-1.5 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 rounded-full bg-brand-blue-deep px-4 py-2 text-xs font-semibold text-white"
        >
          <Search size={13} />
          Search
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-brown-dark/10 bg-white">
        {jobs.length === 0 ? (
          <p className="p-6 text-sm text-brand-brown-dark/70">No jobs found.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-brand-brown-dark/10 text-xs uppercase tracking-wide text-brand-brown-dark/70">
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Sender</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-brand-brown-dark/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/tools/mail-merge/history/${job.id}`}
                      className="font-mono text-xs text-brand-blue-deep hover:underline"
                    >
                      {job.id.slice(0, 12)}…
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-brand-brown-dark/70">
                    {job.senderEmail || job.user?.email || "Anonymous"}
                  </td>
                  <td className="px-4 py-3 text-brand-brown-dark/70">{job.recipientCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[job.status] || ""}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-brand-brown-dark/70">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </ToolShell>
  );
}
