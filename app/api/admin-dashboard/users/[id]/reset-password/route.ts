import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin-api";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  const resetUrl = new URL(`/reset-password/${token}`, request.url).toString();
  const emailed = await sendPasswordResetEmail(user.email, resetUrl);

  return NextResponse.json({ ok: true, resetUrl, emailed });
}
