"use client";

import Link from "next/link";
import {
  Mail,
  Loader2,
  Sparkles,
  FileText,
  Lock,
  History,
  Download,
  Users,
  Paperclip,
  PenLine,
  Eye,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { UsageCard } from "@/components/mail-merge/UsageCard";
import { UpgradeDialog } from "@/components/mail-merge/UpgradeDialog";
import { RecipientPreviewTable } from "@/components/mail-merge/RecipientPreviewTable";
import { SendMethodStep } from "@/components/mail-merge/SendMethodStep";
import { EMPTY_SMTP_CONFIG, type SmtpConfigState } from "@/lib/mail-merge/smtp-providers";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/mail-merge/RichTextEditor";
import { TemplateLibrary } from "@/components/mail-merge/TemplateLibrary";
import { EmailPreview } from "@/components/mail-merge/EmailPreview";
import { AttachmentFolderPicker, attachmentLeafName } from "@/components/mail-merge/AttachmentFolderPicker";
import { RecipientValidationReport } from "@/components/mail-merge/RecipientValidationReport";
import { UploadDialog } from "@/components/mail-merge/UploadDialog";
import { ConfirmSendDialog } from "@/components/mail-merge/ConfirmSendDialog";
import { SendProgress } from "@/components/mail-merge/SendProgress";
import { WizardStepper, type WizardStepId } from "@/components/mail-merge/WizardStepper";
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

const STEP_ICONS: Record<WizardStepId, LucideIcon> = {
  recipients: Users,
  attachments: Paperclip,
  composer: PenLine,
  preview: Eye,
};

function StepHeading({ step, title, description }: { step: WizardStepId; title: string; description?: string }) {
  const Icon = STEP_ICONS[step];
  return (
    <div className="mb-7 flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue-deep to-brand-blue text-white shadow-md shadow-brand-blue/20">
        <Icon size={20} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-brand-brown-dark">{title}</h2>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-brand-brown-dark/65">{description}</p>}
      </div>
    </div>
  );
}

function WizardNav({
  onBack,
  onCancel,
  onNext,
  nextLabel = "Submit",
  nextDisabled = false,
  nextVariant = "primary",
}: {
  onBack?: () => void;
  onCancel: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /**
   * "primary" (default) is the highlighted gradient CTA — used for the
   * step that actually does the consequential thing (advance with a real
   * send, etc.). "secondary" is a plain outline button, used where the
   * next step is itself a review/preview step, so the emphasis stays on
   * looking at that preview rather than looking like a send button.
   */
  nextVariant?: "primary" | "secondary";
}) {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-brand-brown-dark/10 pt-7">
      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-brand-brown-dark/15 px-5 py-2.5 text-sm font-semibold text-brand-brown-dark transition-colors hover:border-brand-blue/40 hover:bg-brand-cream"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-5 py-2.5 text-sm font-semibold text-status-danger transition-colors hover:bg-status-danger/5"
        >
          Cancel
        </button>
      </div>
      {nextVariant === "secondary" ? (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="rounded-full border border-brand-blue-deep/40 px-6 py-3 text-sm font-semibold text-brand-blue-deep transition-colors hover:bg-brand-blue/5 disabled:opacity-50"
        >
          {nextLabel}
        </button>
      ) : (
        <MagneticButton onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
        </MagneticButton>
      )}
    </div>
  );
}

const PRIVACY_NOTE = (
  <p className="mt-6 flex items-start gap-2 text-xs text-brand-brown-dark/70">
    <Mail size={14} className="mt-0.5 shrink-0" />
    Unlike PDF Genie&apos;s other tools, Mail Merge has to send your recipient list, message, and
    attachments to our server to deliver the emails — they aren&apos;t processed locally in your browser.
  </p>
);

export default function MailMergePage() {
  const [stage, setStage] = useState<"auth" | "compose">("auth");
  const [composeStep, setComposeStep] = useState<WizardStepId>("recipients");
  const [smtp, setSmtp] = useState<SmtpConfigState>(EMPTY_SMTP_CONFIG);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [problems, setProblems] = useState<RowProblem[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  // Shown by default on the Preview & send step, so the first recipient's
  // personalized email is visible immediately — not hidden behind a toggle
  // the user has to think to click before sending.
  const [showPreview, setShowPreview] = useState(true);

  const [parsing, setParsing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startedJob, setStartedJob] = useState<{ jobId: string; recipientCount: number } | null>(null);

  const richTextRef = useRef<RichTextEditorHandle>(null);
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);
  const [upgrade, setUpgrade] = useState<{ open: boolean; message?: string }>({ open: false });

  // Jumping between wizard steps should always land the user at the top of
  // the new step's content, not wherever they happened to be scrolled to.
  useEffect(() => {
    if (stage === "compose") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage, composeStep]);

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
    setShowPreview(true);
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
    setSubject("");
    setBody("");
    setError(null);
    setStartedJob(null);
    setShowPreview(true);
    setComposeStep("recipients");
  }

  // Cancelling from the very first wizard step has nothing to "undo" in the
  // draft yet, so it cancels the whole attempt and returns to choosing a
  // sending method instead — otherwise clicking Cancel there looked like it
  // did nothing (it was only resetting fields that were already empty).
  function handleCancelToAuth() {
    reset();
    setStage("auth");
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

      {stage === "auth" ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <SendMethodStep
              onContinue={(config) => {
                setSmtp(config);
                setStage("compose");
              }}
            />
            {PRIVACY_NOTE}
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
      ) : (
        <div className="mx-auto w-full max-w-3xl">
          <div className="surface-card rounded-3xl border border-brand-brown-dark/10 bg-white p-6 sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <WizardStepper current={composeStep} />
              </div>
              <button
                type="button"
                onClick={handleCancelToAuth}
                aria-label="Cancel Mail Merge"
                title="Cancel Mail Merge"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-brown-dark/50 transition-colors hover:bg-status-danger/10 hover:text-status-danger"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-b border-brand-brown-dark/10 pb-7 text-sm">
              <span className="text-brand-brown-dark/80">
                {smtp.useCustom ? (
                  <>
                    Sending as <span className="font-semibold text-brand-brown-dark">{smtp.fromEmail}</span>
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

            <div className="mt-8">
              {composeStep === "recipients" && (
                <div>
                  <StepHeading
                    step="recipients"
                    title="Upload your recipient list"
                    description='Excel or CSV, with a column named "Email" — that&apos;s the only requirement.'
                  />
                  <a
                    href="/samples/mail-merge-template.xlsx"
                    download
                    className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-deep hover:underline"
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
                    <div className="space-y-4">
                      <FileChip name={excelFile.name} size={excelFile.size} onRemove={reset} />
                      {recipients && (
                        <>
                          <p className="text-sm text-brand-brown-dark/70">{recipients.length} recipients found</p>
                          <RecipientPreviewTable recipients={recipients} />
                        </>
                      )}
                    </div>
                  )}
                  {error && <p className="mt-4 text-sm font-medium text-status-danger">{error}</p>}

                  <WizardNav
                    onCancel={handleCancelToAuth}
                    onNext={() => setComposeStep("attachments")}
                    nextDisabled={!recipients}
                  />
                </div>
              )}

              {composeStep === "attachments" && recipients && (
                <div>
                  <StepHeading
                    step="attachments"
                    title="Attach PDF files"
                    description={
                      'Optional. By default, every file you upload goes to every recipient. To send a different file per person, add a column named "Attachment" to your Excel sheet with the exact filename to send them (e.g. invoice_john.pdf).'
                    }
                  />

                  <RecipientValidationReport
                    cleanCount={recipients.length - attachmentIssues.length}
                    problems={problems}
                    attachmentIssues={attachmentIssues}
                    extraFiles={extraFiles}
                    duplicateFiles={duplicateFiles}
                    onContinue={handleContinueWithValidOnly}
                  />

                  <button
                    type="button"
                    data-hover="true"
                    onClick={() => setAttachmentsModalOpen(true)}
                    className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-brand-brown-dark/15 bg-white p-4 text-left transition-colors hover:border-brand-blue/40 hover:bg-brand-blue/5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue-deep to-brand-blue text-white">
                      <Paperclip size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-brand-brown-dark">
                        {attachments.length > 0 ? "Add more PDF files" : "Attach PDF files"}
                      </span>
                      <span className="block text-xs text-brand-brown-dark/60">
                        Up to 30 attachments on the free plan, or select a whole folder
                      </span>
                    </span>
                  </button>

                  <UploadDialog
                    open={attachmentsModalOpen}
                    title="Attach PDF files"
                    onClose={() => setAttachmentsModalOpen(false)}
                  >
                    <AttachmentFolderPicker
                      onFiles={(files) => {
                        setAttachments((prev) => [...prev, ...files]);
                        setAttachmentsModalOpen(false);
                      }}
                      hint="Up to 30 attachments on the free plan"
                    />
                  </UploadDialog>

                  {attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
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
                    <p className="mt-4 text-xs text-brand-brown-dark/70">
                      &quot;Attachment&quot; column detected — attachments will be matched per recipient
                      instead of sent to everyone.
                    </p>
                  )}

                  <WizardNav
                    onBack={() => setComposeStep("recipients")}
                    onCancel={reset}
                    onNext={() => setComposeStep("composer")}
                    nextDisabled={!validationReady}
                  />
                </div>
              )}

              {composeStep === "composer" && recipients && (
                <div>
                  <StepHeading
                    step="composer"
                    title="Compose your email"
                    description="Write once, personalize for everyone with merge fields from your Excel columns."
                  />
                  {columns.length > 0 && (
                    <p className="mb-5 flex flex-wrap gap-1.5 text-xs text-brand-brown-dark/70">
                      Merge fields — click to insert at your cursor:{" "}
                      {[...columns, "Current Date"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => richTextRef.current?.insertText(`{{${c}}}`)}
                          className="rounded-full bg-brand-blue/10 px-2 py-0.5 font-mono text-brand-blue-deep hover:bg-brand-blue/20"
                        >
                          {`{{${c}}}`}
                        </button>
                      ))}
                    </p>
                  )}
                  <div className="space-y-4">
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject — e.g. Promotion Letter - {{Name}}"
                      className="w-full rounded-full border border-brand-brown-dark/15 px-5 py-3 text-sm text-brand-brown-dark outline-none focus:border-brand-blue"
                    />
                    <RichTextEditor
                      ref={richTextRef}
                      content={body}
                      onChange={setBody}
                      placeholder="Write your message. Use {{FieldName}} to personalize."
                    />
                  </div>

                  <div className="mt-5">
                    <TemplateLibrary
                      currentSubject={subject}
                      currentBody={body}
                      onApply={(s, b) => {
                        setSubject(s);
                        setBody(b);
                      }}
                    />
                  </div>
                  {error && <p className="mt-4 text-sm font-medium text-status-danger">{error}</p>}

                  <WizardNav
                    onBack={() => setComposeStep("attachments")}
                    onCancel={reset}
                    onNext={() => {
                      if (!subject.trim() || !body.trim()) {
                        setError("Add a subject and message body first.");
                        return;
                      }
                      setError(null);
                      setComposeStep("preview");
                    }}
                    nextLabel="Preview email"
                  />
                </div>
              )}

              {composeStep === "preview" && recipients && (
                <div>
                  <StepHeading
                    step="preview"
                    title="Preview & send"
                    description="Check how the personalized email looks for a few recipients before sending."
                  />
                  {startedJob ? (
                    <SendProgress
                      jobId={startedJob.jobId}
                      total={startedJob.recipientCount}
                      onClose={handleCancelToAuth}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        data-hover="true"
                        onClick={() => setShowPreview((v) => !v)}
                        className="mb-4 text-sm font-semibold text-brand-blue-deep hover:underline"
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
                      {error && <p className="mt-4 text-sm font-medium text-status-danger">{error}</p>}

                      <WizardNav
                        onBack={() => setComposeStep("composer")}
                        onCancel={reset}
                        onNext={handleSendClick}
                        nextLabel={`Send to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}`}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {PRIVACY_NOTE}
        </div>
      )}

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
