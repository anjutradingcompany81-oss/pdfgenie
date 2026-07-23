import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/auth-schemas";
import { sendPasswordResetEmail } from "@/lib/email";
import { isRateLimited, recordFailedAttempt } from "@/lib/rate-limit";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(`forgot-password:${ip}`)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    recordFailedAttempt(`forgot-password:${ip}`);
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  if (user && !user.disabled) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    const resetUrl = new URL(`/reset-password/${token}`, request.url).toString();
    await sendPasswordResetEmail(email, resetUrl);
  }

  return NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  });
}
