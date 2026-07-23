import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({ toolSlug: z.string().min(1).max(64) });

// Deliberately minimal: a tool slug, an optional signed-in user, and a
// timestamp. No file names, sizes, or content are ever sent here.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const session = await auth();

  await prisma.toolUsageEvent.create({
    data: {
      toolSlug: parsed.data.toolSlug,
      userId: session?.user?.id,
    },
  });

  return NextResponse.json({ ok: true });
}
