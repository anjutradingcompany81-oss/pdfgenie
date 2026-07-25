import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin-api";
import { isAdminGrantExpired } from "@/lib/plans/subscription-expiry";

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
      subscription: {
        select: { status: true, provider: true, currentPeriodEnd: true, plan: { select: { key: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const withPlan = users.map(({ subscription, ...user }) => {
    const active = subscription?.status === "ACTIVE" && !isAdminGrantExpired(subscription);
    const plan = active ? subscription!.plan.key : "FREE";
    const isTrial = active && subscription!.provider === null && subscription!.currentPeriodEnd !== null;
    return {
      ...user,
      plan,
      trialEndsAt: isTrial ? subscription!.currentPeriodEnd : null,
    };
  });

  return NextResponse.json({ users: withPlan });
}
