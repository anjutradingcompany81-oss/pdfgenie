import { NextResponse } from "next/server";
import { resolveIdentity } from "@/lib/mail-merge/resolve-identity";
import { getUsageSummary } from "@/lib/usage-tracking";
import { PLAN_LIMITS } from "@/lib/plans/config";

export async function GET() {
  const { identifier, plan } = await resolveIdentity();
  const usage = await getUsageSummary(identifier, plan);

  return NextResponse.json({ ...usage, limits: PLAN_LIMITS[plan] });
}
