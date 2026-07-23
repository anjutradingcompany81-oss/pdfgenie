import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  const templates = await prisma.emailTemplate.findMany({
    where: session?.user
      ? { OR: [{ isBuiltIn: true }, { userId: session.user.id }] }
      : { isBuiltIn: true },
    orderBy: [{ isBuiltIn: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ templates });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to save custom templates." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Name, subject, and body are required." }, { status: 400 });
  }

  const template = await prisma.emailTemplate.create({
    data: { ...parsed.data, userId: session.user.id, isBuiltIn: false },
  });

  return NextResponse.json({ ok: true, template });
}
