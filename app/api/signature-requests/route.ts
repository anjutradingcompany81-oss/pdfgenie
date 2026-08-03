import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import { SIGNATURE_REQUESTS_DIR, ensureSignatureRequestsDir } from "@/lib/uploads";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be under 20MB." }, { status: 400 });
  }

  const pageIndex = Number(formData.get("pageIndex"));
  const xRatio = Number(formData.get("xRatio"));
  const yRatio = Number(formData.get("yRatio"));
  const wRatio = Number(formData.get("wRatio"));
  const hRatio = Number(formData.get("hRatio"));
  const pageWidthPt = Number(formData.get("pageWidthPt"));
  const pageHeightPt = Number(formData.get("pageHeightPt"));

  const placementFields = [pageIndex, xRatio, yRatio, wRatio, hRatio, pageWidthPt, pageHeightPt];
  if (placementFields.some((n) => !Number.isFinite(n))) {
    return NextResponse.json({ error: "Missing or invalid signature placement." }, { status: 400 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const anonymousId = userId ? null : await getOrCreateAnonymousId();

  await ensureSignatureRequestsDir();
  const fileId = randomUUID();
  const sourceFile = `${fileId}-source.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(SIGNATURE_REQUESTS_DIR, sourceFile), buffer);

  const created = await prisma.signatureRequest.create({
    data: {
      userId,
      anonymousId,
      fileName: file.name || "document.pdf",
      sourceFile,
      pageIndex,
      xRatio,
      yRatio,
      wRatio,
      hRatio,
      pageWidthPt,
      pageHeightPt,
    },
  });

  return NextResponse.json({ token: created.token });
}
