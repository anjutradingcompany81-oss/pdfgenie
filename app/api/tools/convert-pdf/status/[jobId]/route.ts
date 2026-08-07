import { NextResponse } from "next/server";
import { getJob } from "@/lib/pdf-conversion/job-store";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found — it may have expired." }, { status: 404 });
  }

  return NextResponse.json({
    stage: job.stage,
    errorMessage: job.errorMessage,
    errorCode: job.errorCode,
    ready: job.stage === "completed",
  });
}
