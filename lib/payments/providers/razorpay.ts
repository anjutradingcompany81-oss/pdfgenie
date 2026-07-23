// TODO: implement with the real Razorpay SDK once RAZORPAY_KEY_ID /
// RAZORPAY_KEY_SECRET are provisioned. createCheckoutSession would create a
// Razorpay Order/Subscription; verifyWebhookSignature would HMAC-verify the
// X-Razorpay-Signature header against RAZORPAY_WEBHOOK_SECRET.
import { createStubAdapter } from "@/lib/payments/stub-adapter";

export const razorpayAdapter = createStubAdapter("razorpay", "Razorpay");
