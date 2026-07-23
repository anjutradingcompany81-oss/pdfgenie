import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Log in to save custom templates." }, { status: 401 });
  }

  const { id } = await params;
  const source = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!source || (!source.isBuiltIn && source.userId !== session.user.id)) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const copy = await prisma.emailTemplate.create({
    data: {
      userId: session.user.id,
      name: `${source.name} (copy)`,
      subject: source.subject,
      body: source.body,
      isBuiltIn: false,
    },
  });

  return NextResponse.json({ ok: true, template: copy });
}
