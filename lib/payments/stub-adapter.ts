import { PaymentProviderNotConfiguredError, type PaymentProviderAdapter } from "@/lib/payments/types";

/** Shared by every provider in lib/payments/providers/ — none are wired up yet. */
export function createStubAdapter(
  id: PaymentProviderAdapter["id"],
  displayName: string
): PaymentProviderAdapter {
  return {
    id,
    displayName,
    async createCheckoutSession() {
      throw new PaymentProviderNotConfiguredError(displayName);
    },
    verifyWebhookSignature() {
      return false;
    },
  };
}
