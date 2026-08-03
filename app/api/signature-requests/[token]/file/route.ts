import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SIGNATURE_REQUESTS_DIR } from "@/lib/uploads";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const variant = new URL(request.url).searchParams.get("variant") === "signed" ? "signed" : "source";

  const req = await prisma.signatureRequest.findUnique({ where: { token } });
  if (!req) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filename = variant === "signed" ? req.signedFile : req.sourceFile;
  if (!filename) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(SIGNATURE_REQUESTS_DIR, filename));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${req.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
