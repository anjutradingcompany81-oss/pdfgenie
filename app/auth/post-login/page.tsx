import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentPlan } from "@/lib/plans/get-current-plan";

/**
 * Single decision point both login and signup route through (credentials
 * directly via client-side router.push, Google OAuth via its own
 * callbackUrl) so "where does a freshly-authenticated user land" only
 * needs to be figured out in one place.
 *
 * An explicit callbackUrl (e.g. someone sent to /login from a blocked
 * tool or mid-checkout) always wins — this page only makes its own
 * decision when nothing more specific was requested.
 */
export default async function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (callbackUrl) redirect(callbackUrl);

  const plan = await getCurrentPlan(session.user.id);
  redirect(plan === "FREE" ? "/choose-plan" : "/dashboard");
}
