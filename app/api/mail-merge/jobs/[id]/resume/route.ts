import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getJobIfAccessible } from "@/lib/mail-merge/job-access";
import { hasJobEntry } from "@/lib/mail-merge/job-registry";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobIfAccessible(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (job.status !== "PAUSED") {
    return NextResponse.json({ error: "This job isn't paused." }, { status: 409 });
  }
  if (!hasJobEntry(id)) {
    return NextResponse.json({ ok: false, code: "REGISTRY_LOST" }, { status: 409 });
  }

  await prisma.mailMergeJob.update({ where: { id }, data: { status: "SENDING" } });
  return NextResponse.json({ ok: true });
}
