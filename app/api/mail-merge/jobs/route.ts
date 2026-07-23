import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  const params = request.nextUrl.searchParams;

  const where: Prisma.MailMergeJobWhereInput = {};

  if (session?.user?.role === "ADMIN" && params.get("all") === "true") {
    // no owner filter — admins can see every job
  } else if (session?.user) {
    where.userId = session.user.id;
  } else {
    const store = await cookies();
    const anonId = store.get("pdfgenie_anon_id")?.value;
    if (!anonId) return NextResponse.json({ jobs: [] });
    where.anonymousId = anonId;
  }

  const status = params.get("status");
  if (status) where.status = status as Prisma.MailMergeJobWhereInput["status"];

  const jobId = params.get("jobId");
  if (jobId) where.id = { contains: jobId, mode: "insensitive" };

  const from = params.get("from");
  const to = params.get("to");
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
  }

  const jobs = await prisma.mailMergeJob.findMany({
    where,
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ jobs });
}
