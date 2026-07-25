"use client";

import Link from "next/link";
import { Mail, Loader2, Sparkles, FileText, Lock, History, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { UsageCard } from "@/components/mail-merge/UsageCard";
import { UpgradeDialog } from "@/components/mail-merge/UpgradeDialog";
import { RecipientPreviewTable } from "@/components/mail-merge/RecipientPreviewTable";
import { SendMethodStep } from "@/components/mail-merge/SendMethodStep";
import { EMPTY_SMTP_CONFIG, type SmtpConfigState } from "@/lib/mail-merge/smtp-providers";
import { RichTextEditor } from "@/components/mail-merge/RichTextEditor";
import { TemplateLibrary } from "@/components/mail-merge/TemplateLibrary";
import { EmailPreview } from "@/components/mail-merge/EmailPreview";
import { AttachmentFolderPicker, attachmentLeafName } from "@/components/mail-merge/AttachmentFolderPicker";
import { RecipientValidationReport } from "@/components/mail-merge/RecipientValidationReport";
import { ConfirmSendDialog } from "@/components/mail-merge/ConfirmSendDialog";
import { SendProgress } from "@/components/mail-merge/SendProgress";
import { resolveRecipientAttachmentNames, findExtraAndDuplicateFiles } from "@/lib/mail-merge/resolve-attachments";
import type { RowProblem } from "@/lib/mail-merge/parse-recipients";

type Recipient = { email: string; fields: Record<string, string> };

const PREMIUM_FEATURES = [
  "Scheduled campaigns",
  "Multiple SMTP accounts",
  "Outlook integration",
  "Gmail OAuth",
  "Team workspaces",
  "Advanced analytics",
  "Priority support",
];

function StepLabel({ n, children }: { n: number; children: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-brown-dark">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue-deep text-[11px] font-bold text-white">
        {n}
      </span>
      {children}
    </p>
  );
}

export default function MailMergePage() {
  const [stage, setStage] = useState<"auth" | "compose">("auth");
  const [smtp, setSmtp] = useState<SmtpConfigState>(EMPTY_SMTP_CONFIG);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [problems, setProblems] = useState<RowProblem[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [parsing, setParsing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startedJob, setStartedJob] = useState<{ jobId: string; recipientCount: number } | null>(null);

  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const [upgrade, setUpgrade] = useState<{ open: boolean; message?: string }>({ open: false });

  const hasAttachmentColumn = columns.some((c) => c.trim().toLowerCase() === "attachment");
  const uploadedFilenames = useMemo(() => attachments.map((a) => attachmentLeafName(a)), [attachments]);
  const attachmentIssues = useMemo(() => {
    if (!recipients || !hasAttachmentColumn) return [];
    const issues: { email: string; missing: string[] }[] = [];
    for (const r of recipients) {
      const { missing } = resolveRecipientAttachmentNames(r.fields, uploadedFilenames);
      if (missing.length > 0) issues.push({ email: r.email, missing });
    }
    return issues;
  }, [recipients, hasAttachmentColumn, uploadedFilenames]);
  const { extra: extraFiles, duplicates: duplicateFiles } = useMemo(
    () => (recipients ? findExtraAndDuplicateFiles(recipients, uploadedFilenames) : { extra: [], duplicates: [] }),
    [recipients, uploadedFilenames]
  );
  const validationReady = attachmentIssues.length === 0;

  async function handleExcelFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError(null);
    setStartedJob(null);
    setRecipients(null);
    setProblems([]);
    setShowPreview(false);
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
      setProblems(data.problems ?? []);
    } finally {
      setParsing(false);
    }
  }

  function reset() {
    setExcelFile(null);
    setRecipients(null);
    setProblems([]);
    setColumns([]);
    setAttachments([]);
    setError(null);
    setStartedJob(null);
    setShowPreview(false);
  }

  function handleContinueWithValidOnly() {
    if (!recipients) return;
    const issueEmails = new Set(attachmentIssues.map((i) => i.email));
    setRecipients(recipients.filter((r) => !issueEmails.has(r.email)));
  }

  function handleSendClick() {
    if (!excelFile || !recipients) return;
    if (!subject.trim() || !body.trim()) {
      setError("Add a subject and message body first.");
      return;
    }
    if (smtp.useCustom && (!smtp.host || !smtp.user || !smtp.password || !smtp.fromEmail)) {
      setError("Fill in your SMTP host, username, password, and from-email, or uncheck custom SMTP.");
      return;
    }
    setError(null);
    setConfirmOpen(true);
  }

  async function handleConfirmSend() {
    if (!excelFile || !recipients) return;
    setStarting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("excel", excelFile);
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("smtpConfig", JSON.stringify(smtp));
      attachments.forEach((file) => formData.append("attachments", file));

      const res = await fetch("/api/mail-merge/send", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setConfirmOpen(false);
        if (data.limitReached) {
          setUpgrade({ open: true, message: data.error });
        } else {
          setError(data.error || "Something went wrong starting that campaign.");
        }
        return;
      }

      setConfirmOpen(false);
      setStartedJob({ jobId: data.jobId, recipientCount: data.recipientCount });
      setUsageRefreshKey((k) => k + 1);
    } finally {
      setStarting(false);
    }
  }

  return (
    <ToolShell
      icon={Mail}
      title="Mail Merge"
      description="Send personalized emails to a list from an Excel file, with optional PDF attachments."
      skipUsageGate
    >
      <div className="mb-6 flex justify-end">
        <Link
          href="/tools/mail-merge/history"
          className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue-deep hover:underline"
        >
          <History size={14} />
          View past jobs
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {stage === "auth" ? (
            <SendMethodStep
              onContinue={(config) => {
                setSmtp(config);
                setStage("compose");
              }}
            />
          ) : (
          <>
          <div>
            <StepLabel n={1}>Sending method</StepLabel>
            <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-brown-dark/10 bg-white p-4 text-sm">
              <span className="text-brand-brown-dark">
                {smtp.useCustom ? (
                  <>
                    Sending as <span className="font-semibold">{smtp.fromEmail}</span>
                  </>
                ) : (
                  "Sending from PDF Genie's address"
                )}
              </span>
              <button
                type="button"
                data-hover="true"
                onClick={() => setStage("auth")}
                className="text-xs font-semibold text-brand-blue-deep hover:underline"
              >
                Change sending method
              </button>
            </div>
          </div>

          <div>
            <StepLabel n={2}>Upload recipient list (Excel or CSV, needs an &quot;Email&quot; column)</StepLabel>
            <a
              href="/samples/mail-merge-template.xlsx"
              download
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-deep hover:underline"
            >
              <Download size={14} />
              Download sample Excel template
            </a>
            {!excelFile && (
              <Dropzone
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onFiles={handleExcelFile}
                label="Drop your recipient list here, or click to browse"
                hint="Up to 30 recipients and 10MB on the free plan"
              />
            )}
            {parsing && (
              <p className="flex items-center gap-2 text-sm text-brand-brown-dark/70">
                <Loader2 size={16} className="animate-spin" />
                Reading file…
              </p>
            )}
            {excelFile && (
              <div className="space-y-3">
                <FileChip name={excelFile.name} size={excelFile.size} onRemove={reset} />
                {recipients && (
                  <>
                    <p className="text-sm text-brand-brown-dark/70">{recipients.length} recipients found</p>
                    <RecipientPreviewTable recipients={recipients} />
                  </>
                )}
              </div>
            )}
          </div>

          {recipients && (
            <>
              <div>
                <StepLabel n={3}>Upload PDF files (optional)</StepLabel>
                <p className="mb-3 text-xs text-brand-brown-dark/70">
                  By default, every file you drop here is sent to every recipient. To send a
                  different file per person instead, add a column named{" "}
                  <span className="font-mono text-brand-blue-deep">Attachment</span> to your
                  Excel sheet containing the exact filename to send them (e.g.{" "}
                  <span className="font-mono">invoice_john.pdf</span>) — then upload all the
                  files below and Mail Merge will match each recipient to their file.
                </p>
                <AttachmentFolderPicker
                  onFiles={(files) => setAttachments((prev) => [...prev, ...files])}
                  hint="Up to 30 attachments on the free plan"
                />
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, i) => (
                      <FileChip
                        key={`${file.name}-${i}`}
                        name={attachmentLeafName(file)}
                        size={file.size}
                        onRemove={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      />
                    ))}
                  </div>
                )}
                {hasAttachmentColumn && (
                  <p className="mt-3 text-xs text-brand-brown-dark/70">
                    &quot;Attachment&quot; column detected — attachments will be matched
                    per recipient instead of sent to everyone.
                  </p>
                )}
              </div>

              <div>
                <StepLabel n={4}>Validation report</StepLabel>
                <RecipientValidationReport
                  cleanCount={recipients.length - attachmentIssues.length}
                  problems={problems}
                  attachmentIssues={attachmentIssues}
                  extraFiles={extraFiles}
                  duplicateFiles={duplicateFiles}
                  onContinue={handleContinueWithValidOnly}
                />
              </div>

              {validationReady && (
              <>
              <div>
                <StepLabel n={5}>Email composer</StepLabel>
                {columns.length > 0 && (
                  <p className="mb-3 flex flex-wrap gap-1.5 text-xs text-brand-brown-dark/70">
                    Merge fields:{" "}
                    {[...columns, "Current Date"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBody((b) => `${b}{{${c}}}`)}
                        className="rounded-full bg-brand-blue/10 px-2 py-0.5 font-mono text-brand-blue-deep hover:bg-brand-blue/20"
                      >
                        {`{{${c}}}`}
                      </button>
                    ))}
                  </p>
                )}
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject — e.g. Promotion Letter - {{Name}}"
                  className="mb-3 w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
                />
                <RichTextEditor content={body} onChange={setBody} placeholder="Write your message. Use {{FieldName}} to personalize." />

                <div className="mt-4">
                  <TemplateLibrary
                    currentSubject={subject}
                    currentBody={body}
                    onApply={(s, b) => {
                      setSubject(s);
                      setBody(b);
                    }}
                  />
                </div>
              </div>

              <div>
                <StepLabel n={6}>Email preview</StepLabel>
                <button
                  type="button"
                  data-hover="true"
                  onClick={() => setShowPreview((v) => !v)}
                  className="mb-3 text-sm font-semibold text-brand-blue-deep hover:underline"
                >
                  {showPreview ? "Hide preview" : "Preview personalized emails"}
                </button>
                {showPreview && (
                  <EmailPreview
                    recipients={recipients}
                    subjectTemplate={subject}
                    bodyTemplate={body}
                    uploadedFilenames={uploadedFilenames}
                  />
                )}
              </div>

              {error && <p className="text-sm font-medium text-status-danger">{error}</p>}

              <div>
                <StepLabel n={7}>Send emails</StepLabel>
                {startedJob ? (
                  <SendProgress jobId={startedJob.jobId} total={startedJob.recipientCount} />
                ) : (
                  <MagneticButton onClick={handleSendClick}>
                    {`Send to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}`}
                  </MagneticButton>
                )}
              </div>
              </>
              )}
            </>
          )}
          </>
          )}

          <p className="mt-6 flex items-start gap-2 text-xs text-brand-brown-dark/70">
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
              <h3 className="text-sm font-bold uppercase tracking-wide text-brand-brown-dark">Pro</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-brand-brown-dark/70">
                    <Lock size={12} className="text-brand-brown-dark/70" />
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
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>

      <UpgradeDialog
        open={upgrade.open}
        message={upgrade.message}
        onClose={() => setUpgrade({ open: false })}
      />

      <ConfirmSendDialog
        open={confirmOpen}
        recipientCount={recipients?.length ?? 0}
        starting={starting}
        onConfirm={handleConfirmSend}
        onClose={() => setConfirmOpen(false)}
      />
    </ToolShell>
  );
}
