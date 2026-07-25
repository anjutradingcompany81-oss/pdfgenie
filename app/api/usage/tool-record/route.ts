import { NextResponse } from "next/server";
import { recordToolUsage } from "@/lib/tool-usage";

export const runtime = "nodejs";

export async function POST() {
  const status = await recordToolUsage();
  return NextResponse.json(status);
}
