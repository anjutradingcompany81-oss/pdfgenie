"use client";

import { AlertTriangle, Download, Loader2, RotateCw } from "lucide-react";
import { useState } from "react";
import { findField } from "@/lib/mail-merge/render-template";

type FailedRecipient = {
  id: string;
  email: string;
  error: string | null;
  fields: Record<string, string> | null;
};

export function FailedEmailReport({
  jobId,
  failedRecipients,
  onRetried,
}: {
  jobId: string;
  failedRecipients: FailedRecipient[];
  onRetried: () => void;
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryFiles, setRetryFiles] = useState<File[]>([]);

  if (failedRecipients.length === 0) return null;

  async function handleRetry() {
    setRetrying(true);
    try {
      const formData = new FormData();
      retryFiles.forEach((file) => formData.append("attachments", file));
      const res = await fetch(`/api/mail-merge/jobs/${jobId}/retry`, { method: "POST", body: formData });
      if (res.ok) onRetried();
    } finally {
      setRetrying(false);
    }
  }

  function exportFailed() {
    const rows = failedRecipients.map((r) => ({
      Email: r.email,
      Name: findField(r.fields || {}, "name") || findField(r.fields || {}, "employee name") || "",
      "Failure Reason": r.error || "",
    }));
    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((row) => Object.values(row).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "failed-recipients.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="surface-card rounded-2xl border border-status-danger/20 bg-status-danger/5 p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-status-danger" />
        <h3 className="text-sm font-bold text-status-danger">Failed emails ({failedRecipients.length})</h3>
      </div>

      <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
        {failedRecipients.map((r) => (
          <div key={r.id} className="rounded-xl bg-white p-3 text-sm">
            <p className="font-semibold text-brand-brown-dark">{r.email}</p>
            <p className="mt-0.5 text-xs text-status-danger">{r.error}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-brand-brown-dark">
            Re-attach PDFs before retrying (not stored from the original job)
          </label>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => setRetryFiles(Array.from(e.target.files || []))}
            className="w-full text-xs text-brand-brown-dark/70"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 rounded-full bg-status-danger px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {retrying ? <Loader2 size={13} className="animate-spin" /> : <RotateCw size={13} />}
            Retry failed emails
          </button>
          <button
            type="button"
            onClick={exportFailed}
            className="flex items-center gap-1.5 rounded-full border border-status-danger/30 px-4 py-2 text-xs font-semibold text-status-danger"
          >
            <Download size={13} />
            Export failed records
          </button>
        </div>
      </div>
    </div>
  );
}
