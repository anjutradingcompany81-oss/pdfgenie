import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin-api";
import { setUserPlan, grantTrial } from "@/lib/plans/set-user-plan";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  disabled: z.boolean().optional(),
  planKey: z.enum(["FREE", "PREMIUM", "ENTERPRISE"]).optional(),
  grantTrial: z.literal(true).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  if (id === session!.user.id && (parsed.data.role === "USER" || parsed.data.disabled === true)) {
    return NextResponse.json(
      { error: "You can't demote or disable your own admin account." },
      { status: 400 }
    );
  }

  const { planKey, grantTrial: shouldGrantTrial, ...userFields } = parsed.data;
  if (shouldGrantTrial) {
    await grantTrial(id);
  } else if (planKey) {
    await setUserPlan(id, planKey);
  }

  const user = Object.keys(userFields).length
    ? await prisma.user.update({ where: { id }, data: userFields })
    : await prisma.user.findUniqueOrThrow({ where: { id } });

  return NextResponse.json({ ok: true, user });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  if (id === session!.user.id) {
    return NextResponse.json({ error: "You can't delete your own account here." }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
