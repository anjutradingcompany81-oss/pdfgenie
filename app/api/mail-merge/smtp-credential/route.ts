import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decryptSmtpPassword } from "@/lib/mail-merge/smtp-credential-crypto";

export const runtime = "nodejs";

// Fetches the signed-in user's saved Mail Merge SMTP login, if any, so the
// login step can pre-fill it instead of asking again every time.
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: true, config: null });
  }

  const saved = await prisma.smtpCredential.findUnique({ where: { userId } });
  if (!saved) {
    return NextResponse.json({ ok: true, config: null });
  }

  let password: string;
  try {
    password = decryptSmtpPassword(saved.passwordEnc);
  } catch {
    // Key rotated or data corrupted — treat as no saved credential rather
    // than surfacing a decryption error to the user.
    return NextResponse.json({ ok: true, config: null });
  }

  return NextResponse.json({
    ok: true,
    config: {
      useCustom: true,
      host: saved.host,
      port: String(saved.port),
      secure: saved.secure,
      user: saved.smtpUser,
      password,
      fromEmail: saved.fromEmail,
      fromName: saved.fromName ?? "",
    },
  });
}

// Lets the user "use a different account" — forgets the saved login so
// they're not stuck being auto-filled with an old one.
export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }

  await prisma.smtpCredential.deleteMany({ where: { userId } });
  return NextResponse.json({ ok: true });
}
