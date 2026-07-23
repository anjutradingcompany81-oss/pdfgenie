import { NextRequest, NextResponse } from "next/server";
import { setAdminSessionCookie, verifyCredentials } from "@/lib/admin-auth";
import { clearAttempts, isRateLimited, recordFailedAttempt } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!verifyCredentials(username, password)) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  clearAttempts(ip);
  await setAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
