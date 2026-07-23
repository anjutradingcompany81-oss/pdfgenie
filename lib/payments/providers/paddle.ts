// TODO: implement with the real Paddle SDK once PADDLE_API_KEY /
// PADDLE_WEBHOOK_SECRET are provisioned. createCheckoutSession would open a
// Paddle Checkout session/transaction; verifyWebhookSignature would verify
// the Paddle-Signature header per their webhook docs.
import { createStubAdapter } from "@/lib/payments/stub-adapter";

export const paddleAdapter = createStubAdapter("paddle", "Paddle");
