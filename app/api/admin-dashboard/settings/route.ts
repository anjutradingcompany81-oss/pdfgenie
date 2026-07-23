import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin-api";

const settingsSchema = z.object({
  siteName: z.string().trim().min(1),
  logoUrl: z.string().trim().optional().nullable(),
  contactEmail: z.string().trim().email().optional().or(z.literal("")).nullable(),
  footerText: z.string().trim().optional().nullable(),
  maxFileSizeMb: z.coerce.number().int().min(1).max(500),
  allowedFileTypes: z.string().trim().min(1),
  maintenanceMode: z.boolean(),
});

export async function PATCH(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input." },
      { status: 400 }
    );
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1, ...parsed.data },
    update: parsed.data,
  });

  return NextResponse.json({ ok: true, settings });
}
