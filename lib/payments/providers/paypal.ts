// TODO: implement with the real PayPal SDK once PAYPAL_CLIENT_ID /
// PAYPAL_CLIENT_SECRET are provisioned. createCheckoutSession would create a
// PayPal subscription via the Subscriptions API; verifyWebhookSignature
// would call PayPal's webhook signature verification endpoint.
import { createStubAdapter } from "@/lib/payments/stub-adapter";

export const paypalAdapter = createStubAdapter("paypal", "PayPal");
