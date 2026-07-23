import type { PaymentProviderAdapter } from "@/lib/payments/types";
import { stripeAdapter } from "@/lib/payments/providers/stripe";
import { razorpayAdapter } from "@/lib/payments/providers/razorpay";
import { paypalAdapter } from "@/lib/payments/providers/paypal";
import { paddleAdapter } from "@/lib/payments/providers/paddle";

const ADAPTERS: Record<PaymentProviderAdapter["id"], PaymentProviderAdapter> = {
  stripe: stripeAdapter,
  razorpay: razorpayAdapter,
  paypal: paypalAdapter,
  paddle: paddleAdapter,
};

export function getPaymentProvider(id: PaymentProviderAdapter["id"]): PaymentProviderAdapter {
  return ADAPTERS[id];
}

export type { PaymentProviderAdapter } from "@/lib/payments/types";
export { PaymentProviderNotConfiguredError } from "@/lib/payments/types";
