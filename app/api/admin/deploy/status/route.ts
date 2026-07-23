import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { readDeployStatus } from "@/lib/deploy-status";

export async function GET() {
  const authed = await getAdminSession();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(readDeployStatus());
}
