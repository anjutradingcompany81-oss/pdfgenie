import { NextRequest, NextResponse } from "next/server";
import { getJobIfAccessible } from "@/lib/mail-merge/job-access";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobIfAccessible(id);
  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Cheap aggregate-only mode for frequent progress polling — avoids
  // pulling every recipient row on each poll tick.
  if (request.nextUrl.searchParams.get("summary") === "true") {
    const rows = await prisma.mailMergeRecipient.groupBy({
      by: ["status"],
      where: { jobId: id },
      _count: true,
    });
    const counts = { PENDING: 0, SENT: 0, FAILED: 0, CANCELLED: 0 };
    for (const row of rows) counts[row.status] = row._count;
    return NextResponse.json({ job, counts });
  }

  const recipients = await prisma.mailMergeRecipient.findMany({
    where: { jobId: id },
    orderBy: { email: "asc" },
  });

  return NextResponse.json({ job, recipients });
}
