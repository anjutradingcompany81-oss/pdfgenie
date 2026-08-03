import { readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SIGNATURE_REQUESTS_DIR } from "@/lib/uploads";
import { embedSignature } from "@/lib/pdf/sign";

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const req = await prisma.signatureRequest.findUnique({ where: { token } });
  if (!req) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (req.status !== "PENDING") {
    return NextResponse.json({ error: "This document has already been signed." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const signaturePng = body?.signaturePng;
  if (typeof signaturePng !== "string" || !signaturePng.startsWith("data:image/png")) {
    return NextResponse.json({ error: "Missing signature image." }, { status: 400 });
  }

  const sourceBytes = await readFile(path.join(SIGNATURE_REQUESTS_DIR, req.sourceFile));
  const signatureBytes = dataUrlToBytes(signaturePng);

  const pdfWidth = req.wRatio * req.pageWidthPt;
  const pdfHeight = req.hRatio * req.pageHeightPt;
  const pdfX = req.xRatio * req.pageWidthPt;
  const pdfY = req.pageHeightPt - req.yRatio * req.pageHeightPt - pdfHeight;

  let signedBytes: Uint8Array;
  try {
    signedBytes = await embedSignature(
      sourceBytes.buffer.slice(sourceBytes.byteOffset, sourceBytes.byteOffset + sourceBytes.byteLength),
      req.pageIndex,
      signatureBytes,
      { x: pdfX, y: pdfY, width: pdfWidth, height: pdfHeight }
    );
  } catch {
    return NextResponse.json({ error: "Couldn't sign that document." }, { status: 500 });
  }

  const signedFile = `${req.id}-signed.pdf`;
  await writeFile(path.join(SIGNATURE_REQUESTS_DIR, signedFile), signedBytes);

  await prisma.signatureRequest.update({
    where: { id: req.id },
    data: { status: "SIGNED", signedFile, signedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
