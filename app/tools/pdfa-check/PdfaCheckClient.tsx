"use client";

import { ScanSearch, Loader2, Check, X, Info } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { checkPdfACompliance, type ComplianceReport } from "@/lib/pdf/pdfa-check";

export default function PdfaCheckPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ComplianceReport | null>(null);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setReport(null);
    setBusy(true);
    try {
      const buf = await f.arrayBuffer();
      const result = await checkPdfACompliance(buf);
      setReport(result);
    } catch {
      setError("Couldn't read that PDF — it may be corrupted.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setReport(null);
    setError(null);
  }

  return (
    <ToolShell
      icon={ScanSearch}
      title="PDF/A Compliance Check"
      description="Check a PDF against the most common PDF/A-1b archival requirements before you submit it somewhere that demands one."
    >
      {!file && (
        <Dropzone accept="application/pdf" onFiles={handleFile} label="Drop a PDF here, or click to browse" />
      )}

      {file && (
        <div className="space-y-6">
          <FileChip name={file.name} size={file.size} onRemove={reset} />

          {busy && (
            <p className="flex items-center gap-2 text-sm text-brand-brown-dark/60">
              <Loader2 size={16} className="animate-spin" />
              Checking…
            </p>
          )}

          {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

          {report && <ReportView report={report} />}
        </div>
      )}

      <div className="mt-6 flex items-start gap-2 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-xs text-brand-brown-dark/70">
        <Info size={14} className="mt-0.5 shrink-0 text-brand-blue-deep" />
        <p>
          This checks the structural requirements that trip up most PDFs — embedded fonts, no
          JavaScript, PDF 1.4+, and an XMP metadata block. It isn&apos;t a substitute for full
          ISO 19005 validation (tools like veraPDF go further); treat a &quot;likely compliant&quot;
          result as a strong signal, not a certificate.
        </p>
      </div>

      <PrivacyNote />
    </ToolShell>
  );
}

function ReportView({ report }: { report: ComplianceReport }) {
  if (report.encrypted) {
    return (
      <div className="rounded-2xl border border-status-danger/25 bg-status-danger/5 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-status-danger">
          <X size={16} className="shrink-0" />
          Not PDF/A compliant — this PDF is encrypted
        </p>
        <p className="mt-2 text-sm text-brand-brown-dark/70">
          PDF/A prohibits encryption entirely. Remove the password first, then check again.
        </p>
      </div>
    );
  }

  const checks = [
    { label: "Not encrypted", pass: !report.encrypted },
    { label: "No embedded JavaScript", pass: !report.hasJavaScript },
    {
      label: `PDF version 1.4 or later (found ${report.pdfVersion})`,
      pass: report.pdfVersion !== "unknown" && parseFloat(report.pdfVersion) >= 1.4,
    },
    { label: "Has XMP metadata block", pass: report.hasXmpMetadata },
  ];

  const unembeddedFonts = report.fonts.filter((f) => !f.embedded);

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border p-5 ${
          report.likelyCompliant
            ? "border-emerald-500/25 bg-emerald-500/5"
            : "border-status-danger/25 bg-status-danger/5"
        }`}
      >
        <p
          className={`flex items-center gap-2 text-sm font-semibold ${
            report.likelyCompliant ? "text-emerald-700" : "text-status-danger"
          }`}
        >
          {report.likelyCompliant ? <Check size={16} className="shrink-0" /> : <X size={16} className="shrink-0" />}
          {report.likelyCompliant ? "Likely PDF/A-1b compliant" : "Not likely PDF/A-1b compliant"}
        </p>
        <p className="mt-1 text-sm text-brand-brown-dark/70">
          {report.pageCount} {report.pageCount === 1 ? "page" : "pages"} checked.
        </p>
      </div>

      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-3 rounded-xl border border-brand-brown-dark/10 bg-white px-4 py-3 text-sm">
            {c.pass ? (
              <Check size={16} className="shrink-0 text-emerald-600" />
            ) : (
              <X size={16} className="shrink-0 text-status-danger" />
            )}
            <span className="text-brand-brown-dark">{c.label}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-brand-brown-dark/10 bg-white px-4 py-3">
        <p className="mb-2 flex items-center gap-3 text-sm font-semibold text-brand-brown-dark">
          {unembeddedFonts.length === 0 ? (
            <Check size={16} className="shrink-0 text-emerald-600" />
          ) : (
            <X size={16} className="shrink-0 text-status-danger" />
          )}
          All fonts embedded
        </p>
        {report.fonts.length === 0 ? (
          <p className="pl-7 text-xs text-brand-brown-dark/50">No fonts used in this document.</p>
        ) : (
          <ul className="space-y-1 pl-7">
            {report.fonts.map((f) => (
              <li key={f.name} className="flex items-center justify-between text-xs text-brand-brown-dark/70">
                <span className="truncate">{f.name}</span>
                <span className={f.embedded ? "text-emerald-600" : "text-status-danger"}>
                  {f.embedded ? "Embedded" : "Not embedded"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
