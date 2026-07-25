import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getJobIfAccessible } from "@/lib/mail-merge/job-access";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobIfAccessible(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (job.status !== "SENDING") {
    return NextResponse.json({ error: "This job isn't currently sending." }, { status: 409 });
  }

  await prisma.mailMergeJob.update({ where: { id }, data: { status: "PAUSED" } });
  return NextResponse.json({ ok: true });
}
