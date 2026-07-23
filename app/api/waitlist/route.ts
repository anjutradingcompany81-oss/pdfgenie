import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().trim().email(),
  feature: z.string().trim().min(1).max(64),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await prisma.waitlistSignup.create({
    data: { email: parsed.data.email.toLowerCase(), feature: parsed.data.feature },
  });

  return NextResponse.json({ ok: true });
}
