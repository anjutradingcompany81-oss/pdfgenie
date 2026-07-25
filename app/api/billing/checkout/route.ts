import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPaymentProvider, PaymentProviderNotConfiguredError } from "@/lib/payments";
import { isThrottled } from "@/lib/rate-limit";

export const runtime = "nodejs";

const PURCHASABLE_PLANS = new Set(["PREMIUM", "ENTERPRISE"]);
const THROTTLE_MAX = 10;
const THROTTLE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isThrottled(`billing-checkout:${session.user.id}`, THROTTLE_MAX, THROTTLE_WINDOW_MS)) {
    return NextResponse.json({ error: "Too many checkout attempts — please wait a few minutes." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const planKey = body?.planKey;
  if (typeof planKey !== "string" || !PURCHASABLE_PLANS.has(planKey)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  try {
    const session_ = await getPaymentProvider("razorpay").createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name ?? null,
      planKey: planKey as "PREMIUM" | "ENTERPRISE",
    });
    return NextResponse.json(session_);
  } catch (err) {
    if (err instanceof PaymentProviderNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[billing/checkout]", err);
    return NextResponse.json({ error: "Couldn't start checkout — please try again." }, { status: 500 });
  }
}
