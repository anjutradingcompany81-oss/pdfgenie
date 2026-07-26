"use client";

import {
  FileSignature,
  Files,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Home,
  RotateCcw,
  Lock,
  MapPin,
  Building2,
  Phone,
  Image as ImageIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { ToolShell } from "@/components/tools/ToolShell";
import { Dropzone } from "@/components/tools/Dropzone";
import { FileChip } from "@/components/tools/FileChip";
import { PrivacyNote } from "@/components/tools/PrivacyNote";
import { getPageCount } from "@/lib/pdf/pdfjs";
import { parseCertificate, CertificateError, type CertificateInfo } from "@/lib/pdf/dsc/certificate";
import { signPdf } from "@/lib/pdf/dsc/sign";
import { resolvePageIndices, describeSelection, type PageSelection } from "@/lib/pdf/dsc/pages";
import { DEFAULT_APPEARANCE, DEFAULT_SECURITY, SIGNING_REASONS, type SignatureAppearance, type SigningDetails, type SecurityOptions, type RGB } from "@/lib/pdf/dsc/types";
import { DscStepper } from "@/components/tools/dsc/DscStepper";
import { PdfPlacementCanvas, type PlacementValue } from "@/components/tools/dsc/PdfPlacementCanvas";
import { downloadBlob, bytesToBlob } from "@/lib/pdf/download";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";

type LoadedFile = { id: string; file: File; buffer: ArrayBuffer; pageCount: number };
type JobStatus = "pending" | "signing" | "done" | "failed";
type Job = { fileId: string; status: JobStatus; resultBytes?: Uint8Array; error?: string };

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rgbToHex(c: RGB): string {
  const toHex = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0");
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
}
function hexToRgb(hex: string): RGB {
  return { r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255 };
}

const inputClass = "w-full rounded-xl border border-dsc-border bg-white px-4 py-2.5 text-sm text-dsc-ink outline-none focus:border-dsc-primary";
const labelClass = "mb-1.5 block text-xs font-semibold text-dsc-ink-muted";

function PrimaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-dsc-primary to-dsc-secondary px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
function SecondaryButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full border border-dsc-border px-6 py-3.5 text-sm font-semibold text-dsc-ink transition-colors hover:bg-dsc-surface disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function WizardNav({ onBack, onCancel, onNext, nextLabel = "Next", nextDisabled }: { onBack?: () => void; onCancel: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-dsc-border pt-6">
      <div className="flex gap-3">
        {onBack && <SecondaryButton onClick={onBack}>Back</SecondaryButton>}
        <button type="button" onClick={onCancel} className="rounded-full px-6 py-3.5 text-sm font-semibold text-dsc-ink-muted hover:text-dsc-ink">
          Cancel
        </button>
      </div>
      <PrimaryButton onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </PrimaryButton>
    </div>
  );
}

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-dsc-ink">{title}</h2>
      <p className="mt-1 text-sm text-dsc-ink-muted">{description}</p>
    </div>
  );
}

export default function DscClient() {
  const [stage, setStage] = useState<"landing" | "wizard">("landing");
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [step, setStep] = useState(1);

  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [certFile, setCertFile] = useState<File | null>(null);
  const [certBuffer, setCertBuffer] = useState<ArrayBuffer | null>(null);
  const [certPassword, setCertPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [certInfo, setCertInfo] = useState<CertificateInfo | null>(null);
  const [certValidating, setCertValidating] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  const [placementPageIndex, setPlacementPageIndex] = useState(0);
  const [placement, setPlacement] = useState<PlacementValue>({ xRatio: 0.58, yRatio: 0.84, wRatio: 0.32, hRatio: 0.1 });

  const [pageSelection, setPageSelection] = useState<PageSelection>({ mode: "last" });
  const [appearance, setAppearance] = useState<SignatureAppearance>(DEFAULT_APPEARANCE);
  const [details, setDetails] = useState<SigningDetails>({
    reason: "Digitally Signed",
    location: "",
    department: "",
    contactInfo: "",
    signingTime: new Date(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [customReason, setCustomReason] = useState("");
  const [security, setSecurity] = useState<SecurityOptions>(DEFAULT_SECURITY);
  const [confirmPassword, setConfirmPassword] = useState("");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [signing, setSigning] = useState(false);
  const [signStatus, setSignStatus] = useState("");
  const [done, setDone] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const primaryFile = loadedFiles[0] ?? null;
  const effectiveReason = details.reason === "Custom" ? customReason : details.reason;

  function reset() {
    setStage("landing");
    setStep(1);
    setLoadedFiles([]);
    setUploadError(null);
    setCertFile(null);
    setCertBuffer(null);
    setCertPassword("");
    setCertInfo(null);
    setCertError(null);
    setPlacementPageIndex(0);
    setPlacement({ xRatio: 0.58, yRatio: 0.84, wRatio: 0.32, hRatio: 0.1 });
    setPageSelection({ mode: "last" });
    setAppearance(DEFAULT_APPEARANCE);
    setDetails({ reason: "Digitally Signed", location: "", department: "", contactInfo: "", signingTime: new Date(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    setCustomReason("");
    setSecurity(DEFAULT_SECURITY);
    setConfirmPassword("");
    setJobs([]);
    setSigning(false);
    setSignStatus("");
    setDone(false);
  }

  function startMode(m: "single" | "multi") {
    setMode(m);
    setStage("wizard");
    setStep(1);
  }

  async function handleFiles(files: File[]) {
    setUploadError(null);
    const picked = mode === "single" ? files.slice(0, 1) : files;
    try {
      const next: LoadedFile[] = [];
      for (const file of picked) {
        const buffer = await file.arrayBuffer();
        const pageCount = await getPageCount(buffer);
        next.push({ id: newId(), file, buffer, pageCount });
      }
      setLoadedFiles((prev) => (mode === "single" ? next : [...prev, ...next]));
    } catch {
      setUploadError("Couldn't read one of those files — make sure they're valid, non-encrypted PDFs.");
    }
  }

  function removeFile(id: string) {
    setLoadedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleCertFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setCertError(null);
    setCertInfo(null);
    const buf = await f.arrayBuffer();
    setCertFile(f);
    setCertBuffer(buf);
  }

  async function handleValidateCertificate() {
    if (!certBuffer) return;
    setCertValidating(true);
    setCertError(null);
    try {
      const info = parseCertificate(certBuffer, certPassword);
      setCertInfo(info);
    } catch (err) {
      setCertInfo(null);
      setCertError(err instanceof CertificateError ? err.message : "Couldn't validate that certificate.");
    } finally {
      setCertValidating(false);
    }
  }

  function handleLogoSelected(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const mime = f.type.includes("png") ? "image/png" : f.type.includes("jpeg") || f.type.includes("jpg") ? "image/jpeg" : null;
    if (!mime) return;
    const reader = new FileReader();
    reader.onload = () => setAppearance((a) => ({ ...a, logoDataUrl: reader.result as string, logoMime: mime }));
    reader.readAsDataURL(f);
  }

  async function handleSignAll() {
    if (!certBuffer || !certInfo) return;
    setSigning(true);
    setDone(false);
    const initialJobs: Job[] = loadedFiles.map((f) => ({ fileId: f.id, status: "pending" }));
    setJobs(initialJobs);

    for (const lf of loadedFiles) {
      setJobs((prev) => prev.map((j) => (j.fileId === lf.id ? { ...j, status: "signing" } : j)));
      setSignStatus(`Applying signature to ${lf.file.name}…`);
      try {
        const pageIndices = resolvePageIndices(pageSelection, lf.pageCount);
        let bytes = await signPdf({
          pdfBytes: lf.buffer,
          p12Bytes: certBuffer,
          password: certPassword,
          certInfo,
          pageIndices,
          placement,
          appearance,
          details: { ...details, reason: effectiveReason },
        });

        if (security.passwordProtect && security.password) {
          setSignStatus(`Encrypting ${lf.file.name}…`);
          bytes = await encryptPDF(bytes, security.password, {
            algorithm: "AES-256",
            allowPrinting: !security.preventPrinting,
            allowModifying: !security.preventEditing,
            allowCopying: !security.preventCopying,
            allowAnnotating: !security.preventAnnotation,
          });
        }

        setJobs((prev) => prev.map((j) => (j.fileId === lf.id ? { ...j, status: "done", resultBytes: bytes } : j)));
      } catch (err) {
        setJobs((prev) => prev.map((j) => (j.fileId === lf.id ? { ...j, status: "failed", error: err instanceof Error ? err.message : "Signing failed." } : j)));
      }
    }

    setSignStatus("Completed");
    setSigning(false);
    setDone(true);
  }

  function signedName(original: string): string {
    return original.toLowerCase().endsWith(".pdf") ? `${original.slice(0, -4)}-signed.pdf` : `${original}-signed.pdf`;
  }

  function downloadOne(job: Job) {
    const lf = loadedFiles.find((f) => f.id === job.fileId);
    if (!lf || !job.resultBytes) return;
    downloadBlob(bytesToBlob(job.resultBytes, "application/pdf"), signedName(lf.file.name));
  }

  async function downloadAllZip() {
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    for (const job of jobs) {
      if (job.status !== "done" || !job.resultBytes) continue;
      const lf = loadedFiles.find((f) => f.id === job.fileId);
      if (!lf) continue;
      zip.file(signedName(lf.file.name), job.resultBytes);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "signed-pdfs.zip");
  }

  const doneCount = jobs.filter((j) => j.status === "done").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  const stepValid = useMemo(() => {
    switch (step) {
      case 1:
        return loadedFiles.length > 0;
      case 2:
        return !!certInfo && certInfo.isValid;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return effectiveReason.trim().length > 0;
      case 7:
        return !security.passwordProtect || (security.password.length >= 4 && security.password === confirmPassword);
      case 8:
        return true;
      default:
        return true;
    }
  }, [step, loadedFiles.length, certInfo, effectiveReason, security, confirmPassword]);

  if (stage === "landing") {
    return (
      <ToolShell
        icon={FileSignature}
        title="Digital Signature (DSC)"
        description="Apply a real, certificate-based digital signature to one or many PDFs — entirely in your browser."
      >
        <div className="dsc-tool">
          <div className="grid gap-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => startMode("single")}
              className="group flex flex-col items-start gap-4 rounded-3xl border border-dsc-border bg-white p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-dsc-primary/50 hover:shadow-xl"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-dsc-primary to-dsc-secondary text-white">
                <FileSignature size={26} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-dsc-ink">Single PDF</h3>
                <p className="mt-1 text-sm text-dsc-ink-muted">Apply your Digital Signature Certificate to one PDF.</p>
              </div>
              <span className="mt-2 rounded-full bg-dsc-primary/10 px-5 py-2 text-sm font-bold text-dsc-primary transition-colors group-hover:bg-dsc-primary group-hover:text-white">
                Start
              </span>
            </button>

            <button
              type="button"
              onClick={() => startMode("multi")}
              className="group flex flex-col items-start gap-4 rounded-3xl border border-dsc-border bg-white p-7 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-dsc-accent/50 hover:shadow-xl"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-dsc-accent to-dsc-secondary text-white">
                <Files size={26} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-dsc-ink">Multiple PDFs</h3>
                <p className="mt-1 text-sm text-dsc-ink-muted">Apply the same Digital Signature to several PDF files at once.</p>
              </div>
              <span className="mt-2 rounded-full bg-dsc-accent/10 px-5 py-2 text-sm font-bold text-dsc-accent transition-colors group-hover:bg-dsc-accent group-hover:text-white">
                Continue
              </span>
            </button>
          </div>
          <PrivacyNote />
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell
      icon={FileSignature}
      title="Digital Signature (DSC)"
      description="Apply a real, certificate-based digital signature to one or many PDFs — entirely in your browser."
    >
    <div className="dsc-tool">
      <div className="surface-card rounded-3xl border border-dsc-border bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <DscStepper current={step} />
          <button type="button" onClick={reset} aria-label="Cancel" className="shrink-0 text-dsc-ink-muted hover:text-dsc-ink">
            <X size={20} />
          </button>
        </div>

        {step === 1 && (
          <div>
            <StepHeading title="Upload your PDF" description={mode === "single" ? "Choose the PDF you want to sign." : "Add as many PDFs as you'd like to sign with the same certificate."} />
            <Dropzone accept="application/pdf" multiple={mode === "multi"} onFiles={handleFiles} label={mode === "single" ? "Drop a PDF here, or click to browse" : "Drop PDFs here, or click to browse"} />
            {uploadError && <p className="mt-3 text-sm font-medium text-status-danger">{uploadError}</p>}
            {loadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {loadedFiles.map((lf) => (
                  <div key={lf.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <FileChip name={lf.file.name} size={lf.file.size} onRemove={() => removeFile(lf.id)} />
                    </div>
                    <span className="shrink-0 text-xs text-dsc-ink-muted">{lf.pageCount} page{lf.pageCount === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            )}
            <WizardNav onCancel={reset} onNext={() => setStep(2)} nextDisabled={!stepValid} />
          </div>
        )}

        {step === 2 && (
          <div>
            <StepHeading title="Digital Signature Certificate" description="Upload your .pfx/.p12 certificate — it's parsed entirely in your browser and never leaves your device." />
            {!certFile ? (
              <Dropzone accept=".pfx,.p12,application/x-pkcs12" onFiles={handleCertFile} label="Drop your certificate here, or click to browse" hint="PFX or P12 files" />
            ) : (
              <FileChip
                name={certFile.name}
                size={certFile.size}
                onRemove={() => {
                  setCertFile(null);
                  setCertBuffer(null);
                  setCertInfo(null);
                  setCertPassword("");
                }}
              />
            )}
            <input ref={certInputRef} type="file" className="hidden" />

            {certFile && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className={labelClass}>Certificate password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={certPassword}
                      onChange={(e) => setCertPassword(e.target.value)}
                      autoComplete="off"
                      className={`${inputClass} pr-10`}
                      placeholder="Enter password"
                    />
                    <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dsc-ink-muted" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <PrimaryButton onClick={handleValidateCertificate} disabled={certValidating || !certPassword}>
                  {certValidating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Validating…
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} /> Validate Certificate
                    </>
                  )}
                </PrimaryButton>

                {certError && <p className="text-sm font-medium text-status-danger">{certError}</p>}

                {certInfo && (
                  <div className="rounded-2xl border border-dsc-border bg-dsc-surface p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-dsc-ink">Certificate details</h4>
                      {certInfo.isValid ? (
                        <span className="flex items-center gap-1 rounded-full bg-status-success/15 px-3 py-1 text-xs font-bold text-status-success">
                          <ShieldCheck size={13} /> Valid
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-status-danger/15 px-3 py-1 text-xs font-bold text-status-danger">
                          <ShieldAlert size={13} /> Expired
                        </span>
                      )}
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-dsc-ink-muted">Owner</dt>
                        <dd className="font-medium text-dsc-ink">{certInfo.ownerName}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-dsc-ink-muted">Organization</dt>
                        <dd className="font-medium text-dsc-ink">{certInfo.organization || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-dsc-ink-muted">Issuer</dt>
                        <dd className="font-medium text-dsc-ink">{certInfo.issuer}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-dsc-ink-muted">Expires</dt>
                        <dd className="font-medium text-dsc-ink">{certInfo.notAfter.toLocaleDateString()}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            )}
            <WizardNav onBack={() => setStep(1)} onCancel={reset} onNext={() => setStep(3)} nextDisabled={!stepValid} />
          </div>
        )}

        {step === 3 && primaryFile && (
          <div>
            <StepHeading title="Choose signature placement" description="Click on the page to place your signature, or drag and resize it. This position is used for every page you choose to sign." />
            <PdfPlacementCanvas buffer={primaryFile.buffer} pageCount={primaryFile.pageCount} pageIndex={placementPageIndex} onPageIndexChange={setPlacementPageIndex} value={placement} onChange={setPlacement} />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["xRatio", "yRatio", "wRatio", "hRatio"] as const).map((key) => (
                <div key={key}>
                  <label className={labelClass}>{key === "xRatio" ? "X" : key === "yRatio" ? "Y" : key === "wRatio" ? "Width" : "Height"} (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(placement[key] * 100)}
                    onChange={(e) => setPlacement((p) => ({ ...p, [key]: Math.min(1, Math.max(0, Number(e.target.value) / 100)) }))}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            <WizardNav onBack={() => setStep(2)} onCancel={reset} onNext={() => setStep(4)} />
          </div>
        )}

        {step === 4 && primaryFile && (
          <div>
            <StepHeading title="Choose pages to sign" description="The visible signature stamp appears on the pages you choose. The cryptographic signature always covers the whole document." />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { mode: "all" as const, label: "Every Page" },
                { mode: "odd" as const, label: "Odd Pages" },
                { mode: "even" as const, label: "Even Pages" },
                { mode: "first" as const, label: "First Page Only" },
                { mode: "last" as const, label: "Last Page Only" },
                { mode: "specific" as const, label: "Specific Pages" },
                { mode: "range" as const, label: "Page Range" },
                { mode: "everyN" as const, label: "Every N Pages" },
              ].map((opt) => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setPageSelection({ mode: opt.mode })}
                  className={`rounded-2xl border p-4 text-left text-sm font-semibold transition-colors ${
                    pageSelection.mode === opt.mode ? "border-dsc-primary bg-dsc-primary/5 text-dsc-primary" : "border-dsc-border text-dsc-ink hover:border-dsc-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {pageSelection.mode === "specific" && (
              <div className="mt-4">
                <label className={labelClass}>Page numbers (comma-separated)</label>
                <input
                  value={pageSelection.specificPages ?? ""}
                  onChange={(e) => setPageSelection({ mode: "specific", specificPages: e.target.value })}
                  placeholder="e.g. 1,4,7,9"
                  className={inputClass}
                />
              </div>
            )}
            {pageSelection.mode === "range" && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>From</label>
                  <input type="number" min={1} max={primaryFile.pageCount} value={pageSelection.rangeFrom ?? 1} onChange={(e) => setPageSelection({ ...pageSelection, mode: "range", rangeFrom: Number(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>To</label>
                  <input type="number" min={1} max={primaryFile.pageCount} value={pageSelection.rangeTo ?? primaryFile.pageCount} onChange={(e) => setPageSelection({ ...pageSelection, mode: "range", rangeTo: Number(e.target.value) })} className={inputClass} />
                </div>
              </div>
            )}
            {pageSelection.mode === "everyN" && (
              <div className="mt-4">
                <label className={labelClass}>Every N pages</label>
                <input type="number" min={1} value={pageSelection.everyN ?? 3} onChange={(e) => setPageSelection({ mode: "everyN", everyN: Number(e.target.value) })} className={inputClass} />
              </div>
            )}

            <p className="mt-4 text-sm text-dsc-ink-muted">{describeSelection(pageSelection, primaryFile.pageCount)}</p>
            <WizardNav onBack={() => setStep(3)} onCancel={reset} onNext={() => setStep(5)} />
          </div>
        )}

        {step === 5 && (
          <div>
            <StepHeading title="Signature appearance" description="Customize how your signature stamp looks." />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <label className="flex items-center justify-between rounded-xl border border-dsc-border p-3">
                  <span className="text-sm font-semibold text-dsc-ink">Visible signature</span>
                  <input type="checkbox" checked={appearance.visible} onChange={(e) => setAppearance((a) => ({ ...a, visible: e.target.checked }))} className="h-4 w-4 accent-dsc-primary" />
                </label>

                <div>
                  <label className={labelClass}>Font size</label>
                  <input type="range" min={6} max={16} value={appearance.fontSize} onChange={(e) => setAppearance((a) => ({ ...a, fontSize: Number(e.target.value) }))} className="w-full" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setAppearance((a) => ({ ...a, bold: !a.bold }))} className={`flex-1 rounded-xl border py-2 text-sm font-bold ${appearance.bold ? "border-dsc-primary bg-dsc-primary/10 text-dsc-primary" : "border-dsc-border text-dsc-ink"}`}>
                    B
                  </button>
                  <button type="button" onClick={() => setAppearance((a) => ({ ...a, italic: !a.italic }))} className={`flex-1 rounded-xl border py-2 text-sm italic ${appearance.italic ? "border-dsc-primary bg-dsc-primary/10 text-dsc-primary" : "border-dsc-border text-dsc-ink"}`}>
                    I
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Text color</label>
                    <input type="color" value={rgbToHex(appearance.textColor)} onChange={(e) => setAppearance((a) => ({ ...a, textColor: hexToRgb(e.target.value) }))} className="h-10 w-full rounded-lg border border-dsc-border" />
                  </div>
                  <div>
                    <label className={labelClass}>Background</label>
                    <input type="color" value={rgbToHex(appearance.backgroundColor)} onChange={(e) => setAppearance((a) => ({ ...a, backgroundColor: hexToRgb(e.target.value) }))} className="h-10 w-full rounded-lg border border-dsc-border" />
                  </div>
                  <div>
                    <label className={labelClass}>Border color</label>
                    <input type="color" value={rgbToHex(appearance.borderColor)} onChange={(e) => setAppearance((a) => ({ ...a, borderColor: hexToRgb(e.target.value) }))} className="h-10 w-full rounded-lg border border-dsc-border" />
                  </div>
                  <div>
                    <label className={labelClass}>Corner radius</label>
                    <input type="range" min={0} max={20} value={appearance.borderRadius} onChange={(e) => setAppearance((a) => ({ ...a, borderRadius: Number(e.target.value) }))} className="w-full" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Logo / stamp image (optional)</label>
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-dsc-border px-4 py-2.5 text-sm text-dsc-ink-muted hover:border-dsc-primary">
                    <ImageIcon size={15} />
                    {appearance.logoDataUrl ? "Change image" : "Upload PNG/JPG"}
                  </button>
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoSelected} />
                </div>
              </div>

              <div className="space-y-2">
                <p className={labelClass}>Show on stamp</p>
                {([
                  ["showName", "Name"],
                  ["showOrganization", "Organization"],
                  ["showDate", "Date"],
                  ["showTime", "Time"],
                  ["showReason", "Reason"],
                  ["showLocation", "Location"],
                  ["showContactInfo", "Contact"],
                  ["showCertInfo", "Certificate info"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between rounded-xl border border-dsc-border px-3 py-2">
                    <span className="text-sm text-dsc-ink">{label}</span>
                    <input type="checkbox" checked={appearance[key]} onChange={(e) => setAppearance((a) => ({ ...a, [key]: e.target.checked }))} className="h-4 w-4 accent-dsc-primary" />
                  </label>
                ))}
              </div>
            </div>
            <WizardNav onBack={() => setStep(4)} onCancel={reset} onNext={() => setStep(6)} />
          </div>
        )}

        {step === 6 && (
          <div>
            <StepHeading title="Signing details" description="This information appears on the signature stamp and inside the certified signature." />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Reason</label>
                <select value={details.reason} onChange={(e) => setDetails((d) => ({ ...d, reason: e.target.value }))} className={inputClass}>
                  {SIGNING_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {details.reason === "Custom" && <input value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Enter a reason" className={`${inputClass} mt-2`} />}
              </div>

              <div>
                <label className={labelClass}>
                  <MapPin size={11} className="mr-1 inline" /> Location
                </label>
                <input value={details.location} onChange={(e) => setDetails((d) => ({ ...d, location: e.target.value }))} placeholder="City, Country" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>
                  <Building2 size={11} className="mr-1 inline" /> Department
                </label>
                <input value={details.department} onChange={(e) => setDetails((d) => ({ ...d, department: e.target.value }))} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>
                  <Phone size={11} className="mr-1 inline" /> Contact information
                </label>
                <input value={details.contactInfo} onChange={(e) => setDetails((d) => ({ ...d, contactInfo: e.target.value }))} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Signing time</label>
                <input
                  type="datetime-local"
                  value={new Date(details.signingTime.getTime() - details.signingTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                  onChange={(e) => setDetails((d) => ({ ...d, signingTime: new Date(e.target.value) }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Timezone</label>
                <input value={details.timezone} onChange={(e) => setDetails((d) => ({ ...d, timezone: e.target.value }))} className={inputClass} />
              </div>
            </div>
            <WizardNav onBack={() => setStep(5)} onCancel={reset} onNext={() => setStep(7)} nextDisabled={!stepValid} />
          </div>
        )}

        {step === 7 && (
          <div>
            <StepHeading title="Security" description="Optionally lock the signed PDF down further." />
            <label className="flex items-center justify-between rounded-xl border border-dsc-border p-4">
              <span className="flex items-center gap-2 text-sm font-semibold text-dsc-ink">
                <Lock size={15} /> Password-protect the signed PDF (AES-256)
              </span>
              <input type="checkbox" checked={security.passwordProtect} onChange={(e) => setSecurity((s) => ({ ...s, passwordProtect: e.target.checked }))} className="h-4 w-4 accent-dsc-primary" />
            </label>

            {security.passwordProtect && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Password</label>
                  <input type="password" value={security.password} onChange={(e) => setSecurity((s) => ({ ...s, password: e.target.value }))} autoComplete="new-password" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Confirm password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputClass} />
                </div>
              </div>
            )}

            <div className="mt-5 space-y-2">
              {([
                ["preventEditing", "Prevent editing"],
                ["preventPrinting", "Prevent printing"],
                ["preventCopying", "Prevent copying text/images"],
                ["preventAnnotation", "Prevent annotation/comments"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-xl border border-dsc-border px-3 py-2">
                  <span className="text-sm text-dsc-ink">{label}</span>
                  <input type="checkbox" checked={security[key]} onChange={(e) => setSecurity((s) => ({ ...s, [key]: e.target.checked }))} className="h-4 w-4 accent-dsc-primary" />
                </label>
              ))}
            </div>
            {security.passwordProtect && security.password && security.password !== confirmPassword && (
              <p className="mt-3 text-sm font-medium text-status-danger">Passwords don&apos;t match.</p>
            )}
            <WizardNav onBack={() => setStep(6)} onCancel={reset} onNext={() => setStep(8)} nextDisabled={!stepValid} />
          </div>
        )}

        {step === 8 && primaryFile && certInfo && (
          <div>
            <StepHeading title="Preview" description="This is an approximation of how the signature will look — the final PDF is generated when you apply the signature." />
            <PdfPlacementCanvas
              buffer={primaryFile.buffer}
              pageCount={primaryFile.pageCount}
              pageIndex={placementPageIndex}
              onPageIndexChange={setPlacementPageIndex}
              value={placement}
              onChange={setPlacement}
              readOnly
              stampPreview={appearance.visible ? { appearance, details: { ...details, reason: effectiveReason }, certInfo } : undefined}
            />
            {mode === "multi" && <p className="mt-3 text-sm text-dsc-ink-muted">{loadedFiles.length} PDFs will be signed with this same placement and appearance.</p>}
            <WizardNav onBack={() => setStep(7)} onCancel={reset} onNext={() => setStep(9)} nextLabel="Continue to sign" />
          </div>
        )}

        {step === 9 && (
          <div>
            {!done ? (
              <div>
                <StepHeading title="Apply digital signature" description={`Ready to sign ${loadedFiles.length} PDF${loadedFiles.length === 1 ? "" : "s"}.`} />
                {!signing ? (
                  <PrimaryButton onClick={handleSignAll}>
                    <FileSignature size={16} /> Apply Signature
                  </PrimaryButton>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-dsc-ink">
                      <Loader2 size={16} className="animate-spin text-dsc-primary" /> {signStatus}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-dsc-border">
                      <div className="h-full rounded-full bg-gradient-to-r from-dsc-primary to-dsc-accent transition-all" style={{ width: `${(doneCount + failedCount) / Math.max(1, loadedFiles.length) * 100}%` }} />
                    </div>
                    {mode === "multi" && (
                      <ul className="space-y-1.5">
                        {loadedFiles.map((lf) => {
                          const job = jobs.find((j) => j.fileId === lf.id);
                          return (
                            <li key={lf.id} className="flex items-center justify-between rounded-lg border border-dsc-border px-3 py-2 text-sm">
                              <span className="truncate text-dsc-ink">{lf.file.name}</span>
                              {job?.status === "signing" && <Loader2 size={14} className="animate-spin text-dsc-primary" />}
                              {job?.status === "done" && <CheckCircle2 size={14} className="text-status-success" />}
                              {job?.status === "failed" && <XCircle size={14} className="text-status-danger" />}
                              {(!job || job.status === "pending") && <span className="text-xs text-dsc-ink-muted">Queued</span>}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
                <WizardNav onBack={() => setStep(8)} onCancel={reset} onNext={handleSignAll} nextLabel="Apply Signature" />
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-success/15 text-status-success">
                  <CheckCircle2 size={34} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-dsc-ink">
                  {failedCount === 0 ? "Signed successfully" : `${doneCount} of ${loadedFiles.length} signed`}
                </h2>
                <p className="mt-1 text-sm text-dsc-ink-muted">
                  {failedCount > 0 ? `${failedCount} file${failedCount === 1 ? "" : "s"} failed — check the certificate password and try again.` : "Your PDF is cryptographically signed and ready to download."}
                </p>

                {mode === "multi" && (
                  <ul className="mx-auto mt-5 max-w-sm space-y-1.5 text-left">
                    {loadedFiles.map((lf) => {
                      const job = jobs.find((j) => j.fileId === lf.id);
                      return (
                        <li key={lf.id} className="flex items-center justify-between rounded-lg border border-dsc-border px-3 py-2 text-sm">
                          <span className="truncate text-dsc-ink">{lf.file.name}</span>
                          {job?.status === "done" ? (
                            <button type="button" onClick={() => downloadOne(job)} className="text-dsc-primary hover:underline">
                              <Download size={14} />
                            </button>
                          ) : (
                            <span className="text-xs text-status-danger">{job?.error ?? "Failed"}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {mode === "single" ? (
                    jobs[0]?.status === "done" && (
                      <PrimaryButton onClick={() => downloadOne(jobs[0])}>
                        <Download size={16} /> Download PDF
                      </PrimaryButton>
                    )
                  ) : (
                    doneCount > 0 && (
                      <PrimaryButton onClick={downloadAllZip}>
                        <Download size={16} /> Download All PDFs
                      </PrimaryButton>
                    )
                  )}
                  <SecondaryButton onClick={reset}>
                    <RotateCcw size={14} className="mr-1.5 inline" /> Sign Another
                  </SecondaryButton>
                  <Link href="/" className="flex items-center gap-1.5 rounded-full px-6 py-3.5 text-sm font-semibold text-dsc-ink-muted hover:text-dsc-ink">
                    <Home size={14} /> Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <PrivacyNote />
    </div>
    </ToolShell>
  );
}
