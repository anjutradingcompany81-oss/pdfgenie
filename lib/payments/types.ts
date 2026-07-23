import type { PlanKey } from "@/lib/plans/config";

/**
 * The interface any payment gateway adapter implements. None of the
 * adapters in lib/payments/providers/ do real work yet — they exist so
 * wiring up a real gateway later means implementing this interface once,
 * not restructuring how the rest of the app thinks about billing.
 */
export interface PaymentProviderAdapter {
  readonly id: "stripe" | "razorpay" | "paypal" | "paddle";
  readonly displayName: string;

  /** Would create a hosted checkout session for the given plan and return its URL. */
  createCheckoutSession(params: {
    userId: string;
    planKey: PlanKey;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ checkoutUrl: string }>;

  /** Would verify an incoming webhook's signature before trusting its payload. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
}

export class PaymentProviderNotConfiguredError extends Error {
  constructor(providerName: string) {
    super(`${providerName} isn't configured yet — subscriptions aren't available in this release.`);
    this.name = "PaymentProviderNotConfiguredError";
  }
}
