import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { clientIp, isThrottled } from "@/lib/rate-limit";
import { validateUpload, sanitizeFileNameForDownload } from "@/lib/pdf-conversion/validation";
import { analyzePDF } from "@/lib/pdf-conversion/analyze";
import { getConversionProvider, isConversionProviderConfigured } from "@/lib/pdf-conversion/provider";
import { createJob, updateJobStage, markJobFailed, markJobCompleted } from "@/lib/pdf-conversion/job-store";
import { writeJobOutput, deleteJobDir, cleanupExpiredJobDirs } from "@/lib/pdf-conversion/temp-storage";
import { toSafeErrorResponse, logConversionEvent } from "@/lib/pdf-conversion/errors";
import { resolveJobIdentity, recordConversionUsage } from "@/lib/pdf-conversion/usage";
import { ConversionError, type ConversionTargetFormat } from "@/lib/pdf-conversion/types";

export const runtime = "nodejs";

const THROTTLE_MAX = 10;
const THROTTLE_WINDOW_MS = 10 * 60 * 1000;

function getRetentionMs(): number {
  const minutes = Number(process.env.FILE_RETENTION_MINUTES) || 30;
  return minutes * 60 * 1000;
}

export async function POST(request: Request) {
  // Until real provider credentials are configured, tell the client to fall
  // back to the existing client-side conversion rather than creating a job
  // that can only fail — see convertPdfViaApi's caller in the tool clients.
  if (!isConversionProviderConfigured()) {
    return NextResponse.json({ error: "Professional PDF conversion isn't configured yet.", code: "NOT_CONFIGURED" }, { status: 503 });
  }

  const ip = clientIp(request);
  if (isThrottled(`convert-pdf:${ip}`, THROTTLE_MAX, THROTTLE_WINDOW_MS)) {
    return NextResponse.json({ error: "Rate limit reached — please wait a few minutes and try again.", code: "RATE_LIMITED" }, { status: 429 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid request.", code: "INVALID_FILE" }, { status: 400 });
  }

  const file = formData.get("file");
  const targetFormatRaw = formData.get("targetFormat");
  const passwordRaw = formData.get("password");
  const password = typeof passwordRaw === "string" && passwordRaw.length > 0 ? passwordRaw : undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided.", code: "INVALID_FILE" }, { status: 400 });
  }
  const targetFormat: ConversionTargetFormat | null =
    targetFormatRaw === "docx" || targetFormatRaw === "xlsx" ? targetFormatRaw : null;
  if (!targetFormat) {
    return NextResponse.json({ error: "Invalid target format.", code: "INVALID_FILE" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    validateUpload({ name: file.name, type: file.type, size: file.size }, bytes);
  } catch (err) {
    const { status, code, message } = toSafeErrorResponse(err);
    return NextResponse.json({ error: message, code }, { status });
  }

  const jobId = randomUUID();
  createJob(jobId, targetFormat, sanitizeFileNameForDownload(file.name), getRetentionMs());

  const identity = await resolveJobIdentity();
  logConversionEvent("conversion_started", { jobId, targetFormat, fileSizeBytes: bytes.byteLength });

  // Runs after the response is sent — this is a long-lived Node process
  // (PM2), not a serverless function, so the event loop keeps this alive.
  // The client tracks progress via the status/download routes below.
  void processConversionJob(jobId, bytes, targetFormat, password, identity);

  cleanupExpiredJobDirs().catch(() => {});

  return NextResponse.json({ jobId });
}

async function processConversionJob(
  jobId: string,
  bytes: Uint8Array,
  targetFormat: ConversionTargetFormat,
  password: string | undefined,
  identity: { userId: string | null; anonymousId: string | null }
): Promise<void> {
  const startedAt = Date.now();
  let provider;
  try {
    updateJobStage(jobId, "analyzing");
    const analysis = await analyzePDF(bytes);
    if (analysis.encrypted && !password) {
      throw new ConversionError("PASSWORD_REQUIRED", "Password protected PDF detected.");
    }

    updateJobStage(jobId, "queued");
    provider = await getConversionProvider();

    updateJobStage(jobId, "converting");
    const result =
      targetFormat === "docx"
        ? await provider.convertToWord(bytes, { password })
        : await provider.convertToExcel(bytes, { password });

    updateJobStage(jobId, "preparing_download");
    const outputPath = await writeJobOutput(jobId, result.bytes, targetFormat);
    markJobCompleted(jobId, outputPath, result.mimeType);

    logConversionEvent("conversion_completed", { jobId, targetFormat, durationMs: Date.now() - startedAt });
    await recordConversionUsage({
      identity,
      targetFormat,
      provider: provider.name,
      status: "COMPLETED",
      pageCount: analysis.pageCount,
      fileSizeBytes: bytes.byteLength,
      processingTimeMs: Date.now() - startedAt,
    });
  } catch (err) {
    const { code, message } = toSafeErrorResponse(err);
    markJobFailed(jobId, code, message);
    logConversionEvent("conversion_failed", { jobId, targetFormat, code, durationMs: Date.now() - startedAt });
    await recordConversionUsage({
      identity,
      targetFormat,
      provider: provider?.name ?? (process.env.PDF_CONVERSION_PROVIDER || "adobe"),
      status: "FAILED",
      fileSizeBytes: bytes.byteLength,
      processingTimeMs: Date.now() - startedAt,
      errorCode: code,
    });
    await deleteJobDir(jobId).catch(() => {});
  }
}
