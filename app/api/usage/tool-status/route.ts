import { NextResponse } from "next/server";
import { getToolUsageStatus } from "@/lib/tool-usage";

export const runtime = "nodejs";

export async function GET() {
  const status = await getToolUsageStatus();
  return NextResponse.json(status);
}
