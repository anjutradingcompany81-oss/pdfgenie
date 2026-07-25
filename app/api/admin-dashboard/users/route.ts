import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin-api";

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const search = request.nextUrl.searchParams.get("search")?.trim() || "";

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabled: true,
      createdAt: true,
      image: true,
      subscription: { select: { status: true, plan: { select: { key: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const withPlan = users.map(({ subscription, ...user }) => ({
    ...user,
    plan: subscription?.status === "ACTIVE" ? subscription.plan.key : "FREE",
  }));

  return NextResponse.json({ users: withPlan });
}
