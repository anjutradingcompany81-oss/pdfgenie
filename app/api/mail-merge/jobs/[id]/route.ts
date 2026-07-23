import { NextRequest, NextResponse } from "next/server";
import { getJobIfAccessible } from "@/lib/mail-merge/job-access";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobIfAccessible(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const recipients = await prisma.mailMergeRecipient.findMany({
    where: { jobId: id },
    orderBy: { email: "asc" },
  });

  return NextResponse.json({ job, recipients });
}
