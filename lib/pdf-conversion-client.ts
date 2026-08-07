"use client";

export type ConversionUiStage =
  | "idle"
  | "uploading"
  | "analyzing"
  | "queued"
  | "converting"
  | "preparing_download"
  | "completed"
  | "failed";

export const STAGE_LABELS: Record<ConversionUiStage, string> = {
  idle: "",
  uploading: "Uploading PDF…",
  analyzing: "Analyzing document…",
  queued: "Sending securely for conversion…",
  converting: "Converting document…",
  preparing_download: "Preparing download…",
  completed: "Completed",
  failed: "Failed",
};

export class PasswordRequiredError extends Error {
  constructor() {
    super("Password protected PDF detected.");
    this.name = "PasswordRequiredError";
  }
}

/** Thrown when the professional conversion provider has no credentials configured yet — callers should fall back to the existing client-side conversion rather than surface this as a user-facing failure. */
export class ProviderNotConfiguredError extends Error {
  constructor() {
    super("Professional PDF conversion isn't configured yet.");
    this.name = "ProviderNotConfiguredError";
  }
}

const POLL_INTERVAL_MS = 1500;

async function pollJob(jobId: string, onStage: (stage: ConversionUiStage) => void): Promise<void> {
  while (true) {
    const res = await fetch(`/api/tools/convert-pdf/status/${jobId}`);
    if (!res.ok) throw new Error("Lost track of this conversion — please try again.");
    const data = (await res.json()) as { stage: ConversionUiStage; ready: boolean; errorMessage: string | null; errorCode: string | null };

    if (data.stage === "completed") {
      onStage("completed");
      return;
    }
    if (data.stage === "failed") {
      if (data.errorCode === "PASSWORD_REQUIRED") throw new PasswordRequiredError();
      throw new Error(data.errorMessage || "Unable to convert this PDF.");
    }
    onStage(data.stage);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

/**
 * Drives the full start -> poll -> download flow against the server-side
 * conversion API (see app/api/tools/convert-pdf/) and returns the converted
 * file. Throws PasswordRequiredError specifically so callers can prompt for
 * a password and retry, or a plain Error with a user-safe message otherwise.
 */
export async function convertPdfViaApi(
  file: File,
  targetFormat: "docx" | "xlsx",
  password: string | undefined,
  onStage: (stage: ConversionUiStage) => void
): Promise<Blob> {
  onStage("uploading");

  const form = new FormData();
  form.append("file", file);
  form.append("targetFormat", targetFormat);
  if (password) form.append("password", password);

  const startRes = await fetch("/api/tools/convert-pdf/start", { method: "POST", body: form });
  const startData = await startRes.json().catch(() => ({}));
  if (!startRes.ok) {
    if (startData.code === "PASSWORD_REQUIRED") throw new PasswordRequiredError();
    if (startData.code === "NOT_CONFIGURED") throw new ProviderNotConfiguredError();
    throw new Error(startData.error || "Unable to convert this PDF.");
  }

  const jobId = startData.jobId as string;
  await pollJob(jobId, onStage);

  onStage("preparing_download");
  const downloadRes = await fetch(`/api/tools/convert-pdf/download/${jobId}`);
  if (!downloadRes.ok) {
    const data = await downloadRes.json().catch(() => ({}));
    throw new Error(data.error || "Unable to download the converted file.");
  }
  return downloadRes.blob();
}
