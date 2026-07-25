import Razorpay from "razorpay";
import type { PlanKey } from "@/lib/plans/config";
import { PaymentProviderNotConfiguredError, type PaymentProviderAdapter } from "@/lib/payments/types";

// Only PREMIUM (Pro) and ENTERPRISE (Team) are purchasable — FREE has no
// Razorpay Plan behind it. Each id is created once in the Razorpay
// Dashboard (Subscriptions -> Plans) and pinned here via env var so
// changing a price later means editing the Dashboard plan, not this code.
const PLAN_ID_BY_KEY: Partial<Record<PlanKey, string | undefined>> = {
  PREMIUM: process.env.RAZORPAY_PLAN_ID_PREMIUM,
  ENTERPRISE: process.env.RAZORPAY_PLAN_ID_ENTERPRISE,
};

// A large-but-finite cycle count — Razorpay Subscriptions require
// total_count > 0 and have no "forever" option. 120 monthly cycles is 10
// years; renewing/re-subscribing before then is effectively never needed.
const MONTHLY_CYCLE_COUNT = 120;

function getClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new PaymentProviderNotConfiguredError("Razorpay");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export const razorpayAdapter: PaymentProviderAdapter = {
  id: "razorpay",
  displayName: "Razorpay",

  async createCheckoutSession({ userId, userEmail, userName, planKey }) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const planId = PLAN_ID_BY_KEY[planKey];
    if (!keyId || !planId) throw new PaymentProviderNotConfiguredError("Razorpay");

    const client = getClient();
    const subscription = await client.subscriptions.create({
      plan_id: planId,
      total_count: MONTHLY_CYCLE_COUNT,
      customer_notify: 1,
      notes: { userId, userEmail, userName: userName ?? "", planKey },
    });

    return { mode: "modal", subscriptionId: subscription.id, keyId };
  },

  verifyWebhookSignature(rawBody, signatureHeader) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signatureHeader) return false;
    return Razorpay.validateWebhookSignature(rawBody, signatureHeader, secret);
  },
};
