import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Defense-in-depth alongside proxy.ts's route matcher: verifies the session
 * directly in each admin Server Component / Route Handler rather than
 * relying solely on the proxy running first.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/dashboard/login");
  }
  return session;
}
