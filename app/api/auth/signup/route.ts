import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signUpSchema } from "@/lib/auth-schemas";
import { isRateLimited, recordFailedAttempt } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(`signup:${ip}`)) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    recordFailedAttempt(`signup:${ip}`);
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    recordFailedAttempt(`signup:${ip}`);
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const hashed = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      password: hashed,
    },
  });

  return NextResponse.json({ ok: true });
}
