"use client";

import { Mail, Loader2, Sparkles, FileText, Lock } from "lucide-react";
import { useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { UsageCard } from "@/components/mail-merge/UsageCard";
import { UpgradeDialog } from "@/components/mail-merge/UpgradeDialog";
import { RecipientPreviewTable } from "@/components/mail-merge/RecipientPreviewTable";

type Recipient = { email: string; fields: Record<string, string> };

const PREMIUM_FEATURES = [
  "Scheduled campaigns",
  "Email template library",
  "Multiple SMTP accounts",
  "Outlook integration",
  "Gmail OAuth",
  "Team workspaces",
  "Advanced analytics",
  "Priority support",
];

export default function MailMergePage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [parsing, setParsing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sent: number; failed: number; smtpConfigured: boolean } | null>(
    null
  );

  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const [upgrade, setUpgrade] = useState<{ open: boolean; message?: string }>({ open: false });

  async function handleExcelFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setRecipients(null);
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append("excel", file);
      const res = await fetch("/api/mail-merge/preview", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setUpgrade({ open: true, message: data.error });
        } else {
          setError(data.error || "Couldn't read that file.");
        }
        return;
      }

      setExcelFile(file);
      setRecipients(data.recipients);
      setColumns(data.columns);
    } finally {
      setParsing(false);
    }
  }

  function reset() {
    setExcelFile(null);
    setRecipients(null);
    setColumns([]);
    setAttachments([]);
    setError(null);
    setResult(null);
  }

  async function handleSend() {
    if (!excelFile || !recipients) return;
    if (!subject.trim() || !body.trim()) {
      setError("Add a subject and message body first.");
      return;
    }
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("excel", excelFile);
      formData.append("subject", subject);
      formData.append("body", body);
      attachments.forEach((file) => formData.append("attachments", file));

      const res = await fetch("/api/mail-merge/send", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (data.limitReached) {
          setUpgrade({ open: true, message: data.error });
        } else {
          setError(data.error || "Something went wrong sending that campaign.");
        }
        return;
      }

      setResult(data);
      setUsageRefreshKey((k) => k + 1);
    } finally {
      setSending(false);
    }
  }

  return (
    <ToolShell
      icon={Mail}
      title="Mail Merge"
      description="Send personalized emails to a list from an Excel file, with optional PDF attachments."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-sm font-semibold text-brand-brown-dark">
              1. Recipient list (Excel or CSV, needs an &quot;Email&quot; column)
            </p>
            {!excelFile && (
              <Dropzone
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onFiles={handleExcelFile}
                label="Drop your recipient list here, or click to browse"
                hint="Up to 30 recipients and 10MB on the free plan"
              />
            )}
            {parsing && (
              <p className="flex items-center gap-2 text-sm text-brand-brown-dark/60">
                <Loader2 size={16} className="animate-spin" />
                Reading file…
              </p>
            )}
            {excelFile && (
              <div className="space-y-3">
                <FileChip name={excelFile.name} size={excelFile.size} onRemove={reset} />
                {recipients && (
                  <>
                    <p className="text-sm text-brand-brown-dark/50">{recipients.length} recipients found</p>
                    <RecipientPreviewTable recipients={recipients} />
                  </>
                )}
              </div>
            )}
          </div>

          {recipients && (
            <>
              <div>
                <p className="mb-3 text-sm font-semibold text-brand-brown-dark">
                  2. PDF attachments (optional, sent with every email)
                </p>
                <Dropzone
                  accept="application/pdf"
                  multiple
                  onFiles={(files) => setAttachments((prev) => [...prev, ...files])}
                  label="Drop PDFs here, or click to browse"
                  hint="Up to 30 attachments on the free plan"
                />
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, i) => (
                      <FileChip
                        key={`${file.name}-${i}`}
                        name={file.name}
                        size={file.size}
                        onRemove={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold text-brand-brown-dark">3. Compose your email</p>
                {columns.length > 0 && (
                  <p className="mb-3 text-xs text-brand-brown-dark/50">
                    Merge fields:{" "}
                    {columns.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBody((b) => `${b}{{${c}}}`)}
                        className="mr-1.5 rounded-full bg-brand-blue/10 px-2 py-0.5 font-mono text-brand-blue-deep hover:bg-brand-blue/20"
                      >
                        {`{{${c}}}`}
                      </button>
                    ))}
                  </p>
                )}
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject — e.g. Hello {{Name}}!"
                  className="mb-3 w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  placeholder="Write your message. Use {{FieldName}} to personalize."
                  className="w-full rounded-2xl border border-brand-brown-dark/15 px-5 py-4 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
                />
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              {result && (
                <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-sm text-brand-brown-dark">
                  <p className="font-semibold">
                    {result.sent} sent, {result.failed} failed.
                  </p>
                  {!result.smtpConfigured && (
                    <p className="mt-1 text-brand-brown-dark/60">
                      Note: email sending isn&apos;t configured on this server yet, so recipients were
                      processed and counted against your quota but no email actually went out.
                    </p>
                  )}
                </div>
              )}

              <MagneticButton onClick={handleSend} disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  `Send to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}`
                )}
              </MagneticButton>
            </>
          )}

          <p className="mt-6 flex items-start gap-2 text-xs text-brand-brown-dark/45">
            <Mail size={14} className="mt-0.5 shrink-0" />
            Unlike PDF Genie&apos;s other tools, Mail Merge has to send your recipient list,
            message, and attachments to our server to deliver the emails — they aren&apos;t
            processed locally in your browser.
          </p>
        </div>

        <div className="space-y-6">
          <UsageCard refreshKey={usageRefreshKey} />

          <div className="rounded-2xl border border-brand-brown-dark/10 bg-white p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-blue-deep" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-brand-brown-dark">Premium</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-brand-brown-dark/70">
                    <Lock size={12} className="text-brand-brown-dark/30" />
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              data-hover="true"
              onClick={() => setUpgrade({ open: true })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-blue-deep py-2.5 text-xs font-semibold text-white"
            >
              <FileText size={14} />
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>

      <UpgradeDialog
        open={upgrade.open}
        message={upgrade.message}
        onClose={() => setUpgrade({ open: false })}
      />
    </ToolShell>
  );
}
