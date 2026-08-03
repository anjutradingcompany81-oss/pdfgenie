import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const req = await prisma.signatureRequest.findUnique({ where: { token } });
  if (!req) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    fileName: req.fileName,
    status: req.status,
    pageIndex: req.pageIndex,
    xRatio: req.xRatio,
    yRatio: req.yRatio,
    wRatio: req.wRatio,
    hRatio: req.hRatio,
    pageWidthPt: req.pageWidthPt,
    pageHeightPt: req.pageHeightPt,
    createdAt: req.createdAt,
    signedAt: req.signedAt,
  });
}
