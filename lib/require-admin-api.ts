import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * proxy.ts only guards page navigation to /admin/dashboard/*, not API
 * routes under a different path — every admin API route must check this
 * itself.
 */
export async function requireAdminApi() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { session: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}
