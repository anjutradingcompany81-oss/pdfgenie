import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getJob, deleteJob } from "@/lib/pdf-conversion/job-store";
import { deleteJobDir } from "@/lib/pdf-conversion/temp-storage";

export const runtime = "nodejs";

const EXTENSION_BY_FORMAT = { docx: "docx", xlsx: "xlsx" } as const;

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job || job.stage !== "completed" || !job.resultPath || !job.resultMimeType) {
    return NextResponse.json({ error: "This conversion isn't ready yet." }, { status: 404 });
  }

  let bytes: Buffer;
  try {
    bytes = await readFile(job.resultPath);
  } catch {
    return NextResponse.json({ error: "The converted file is no longer available — please convert again." }, { status: 404 });
  }

  const filename = `${job.originalFileName}.${EXTENSION_BY_FORMAT[job.targetFormat]}`;

  // One-shot download: once the client has the bytes, the job and its temp
  // directory serve no further purpose.
  deleteJob(jobId);
  deleteJobDir(jobId).catch(() => {});

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": job.resultMimeType,
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
