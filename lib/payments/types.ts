import type { PlanKey } from "@/lib/plans/config";

/**
 * The interface any payment gateway adapter implements. Only razorpay.ts
 * does real work — stripe/paypal/paddle remain stubs (see stub-adapter.ts)
 * until one of those is actually needed.
 *
 * A checkout session is one of two shapes because gateways genuinely
 * differ here, not because of speculative design: Stripe/PayPal/Paddle
 * hand back a hosted page to redirect the browser to, while Razorpay
 * Subscriptions authorize through a client-side Checkout.js modal keyed
 * off a subscription id — there's no hosted URL to redirect to.
 */
export type CheckoutSession =
  | { mode: "redirect"; checkoutUrl: string }
  | { mode: "modal"; subscriptionId: string; keyId: string };

export interface PaymentProviderAdapter {
  readonly id: "stripe" | "razorpay" | "paypal" | "paddle";
  readonly displayName: string;

  /** Starts a checkout for the given plan — see CheckoutSession for the two possible shapes. */
  createCheckoutSession(params: {
    userId: string;
    userEmail: string;
    userName: string | null;
    planKey: PlanKey;
  }): Promise<CheckoutSession>;

  /** Verifies an incoming webhook's signature before trusting its payload. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
}

export class PaymentProviderNotConfiguredError extends Error {
  constructor(providerName: string) {
    super(`${providerName} isn't configured yet — subscriptions aren't available in this release.`);
    this.name = "PaymentProviderNotConfiguredError";
  }
}
