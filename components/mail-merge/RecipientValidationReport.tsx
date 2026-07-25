"use client";

import { AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { buildValidationReportRows, downloadValidationReport } from "@/lib/mail-merge/validation-report";
import type { RowProblem } from "@/lib/mail-merge/parse-recipients";

export function RecipientValidationReport({
  cleanCount,
  problems,
  attachmentIssues,
  extraFiles,
  duplicateFiles,
  onContinue,
}: {
  cleanCount: number;
  problems: RowProblem[];
  attachmentIssues: { email: string; missing: string[] }[];
  extraFiles: string[];
  duplicateFiles: string[];
  onContinue: () => void;
}) {
  const totalIssues = problems.length + attachmentIssues.length;

  function handleDownload() {
    const rows = buildValidationReportRows({ problems, attachmentIssues, extraFiles, duplicateFiles });
    downloadValidationReport(rows, "xlsx");
  }

  if (totalIssues === 0 && extraFiles.length === 0 && duplicateFiles.length === 0) {
    return (
      <div className="surface-card flex items-center gap-2 rounded-2xl border border-status-success/20 bg-status-success/5 p-4 text-sm text-status-success">
        <CheckCircle2 size={16} />
        All {cleanCount} rows validated cleanly — no email or attachment problems found.
      </div>
    );
  }

  return (
    <div className="surface-card space-y-4 rounded-2xl border border-status-warning/25 bg-status-warning/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-status-warning" />
          <h3 className="text-sm font-bold text-brand-brown-dark">Validation report</h3>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 rounded-full border border-brand-brown-dark/15 px-3 py-1.5 text-xs font-semibold text-brand-brown-dark"
        >
          <Download size={13} />
          Download report
        </button>
      </div>

      {problems.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-brand-brown-dark">
            {problems.length} row{problems.length === 1 ? "" : "s"} skipped for email problems (already excluded from
            sending):
          </p>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
            {problems.slice(0, 20).map((p, i) => (
              <p key={i} className="rounded-lg bg-white px-3 py-1.5 text-brand-brown-dark/80">
                Row {p.row}: {p.message}
              </p>
            ))}
            {problems.length > 20 && (
              <p className="text-brand-brown-dark/60">…and {problems.length - 20} more — see the downloaded report.</p>
            )}
          </div>
        </div>
      )}

      {attachmentIssues.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-status-danger">
            {attachmentIssues.length} recipient{attachmentIssues.length === 1 ? "" : "s"} reference an attachment
            filename that hasn&apos;t been uploaded:
          </p>
          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs">
            {attachmentIssues.slice(0, 20).map((issue) => (
              <p key={issue.email} className="rounded-lg bg-white px-3 py-1.5 text-brand-brown-dark/80">
                {issue.email}: {issue.missing.join(", ")}
              </p>
            ))}
            {attachmentIssues.length > 20 && (
              <p className="text-brand-brown-dark/60">…and {attachmentIssues.length - 20} more — see the downloaded report.</p>
            )}
          </div>
        </div>
      )}

      {duplicateFiles.length > 0 && (
        <p className="text-xs text-brand-brown-dark/70">Uploaded more than once: {duplicateFiles.join(", ")}</p>
      )}
      {extraFiles.length > 0 && (
        <p className="text-xs text-brand-brown-dark/70">
          Uploaded but not referenced by any recipient: {extraFiles.join(", ")}
        </p>
      )}

      {attachmentIssues.length > 0 && (
        <button
          type="button"
          onClick={onContinue}
          className="rounded-full bg-brand-blue-deep px-4 py-2 text-xs font-semibold text-white"
        >
          Continue with {cleanCount} valid row{cleanCount === 1 ? "" : "s"} only
        </button>
      )}
    </div>
  );
}
