import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin-api";
import { CONTENT_SLUGS, getContentPage, type ContentSlug } from "@/lib/content-pages";

const bodySchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

function isContentSlug(value: string): value is ContentSlug {
  return (CONTENT_SLUGS as readonly string[]).includes(value);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { slug } = await params;
  if (!isContentSlug(slug)) {
    return NextResponse.json({ error: "Unknown page." }, { status: 404 });
  }

  const page = await getContentPage(slug);
  return NextResponse.json({ page });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { slug } = await params;
  if (!isContentSlug(slug)) {
    return NextResponse.json({ error: "Unknown page." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Title and body are required." }, { status: 400 });
  }

  const page = await prisma.contentPage.upsert({
    where: { slug },
    create: { slug, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ ok: true, page });
}
