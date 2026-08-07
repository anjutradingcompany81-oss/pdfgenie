import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import type { ConversionErrorCode, ConversionTargetFormat } from "./types";

const TARGET_FORMAT_MAP = { docx: "WORD", xlsx: "EXCEL" } as const;

export async function resolveJobIdentity(): Promise<{ userId: string | null; anonymousId: string | null }> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const anonymousId = userId ? null : await getOrCreateAnonymousId();
  return { userId, anonymousId };
}

/**
 * Audit-only usage row — never the document content, only what's needed for
 * cost tracking and future plan limits (see prisma schema PdfConversionJob).
 * Best-effort: a DB hiccup here should never fail the actual conversion.
 */
export async function recordConversionUsage(params: {
  identity: { userId: string | null; anonymousId: string | null };
  targetFormat: ConversionTargetFormat;
  provider: string;
  status: "COMPLETED" | "FAILED";
  pageCount?: number;
  fileSizeBytes?: number;
  processingTimeMs?: number;
  errorCode?: ConversionErrorCode;
}): Promise<void> {
  try {
    await prisma.pdfConversionJob.create({
      data: {
        userId: params.identity.userId,
        anonymousId: params.identity.anonymousId,
        targetFormat: TARGET_FORMAT_MAP[params.targetFormat],
        provider: params.provider,
        status: params.status,
        pageCount: params.pageCount,
        fileSizeBytes: params.fileSizeBytes,
        processingTimeMs: params.processingTimeMs,
        errorCode: params.errorCode,
      },
    });
  } catch {
    // Non-fatal — usage tracking should never break a real conversion.
  }
}
