// TODO: implement with the real Stripe SDK (`stripe` npm package) once
// STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET are provisioned. createCheckoutSession
// would call stripe.checkout.sessions.create(); verifyWebhookSignature would
// use stripe.webhooks.constructEvent().
import { createStubAdapter } from "@/lib/payments/stub-adapter";

export const stripeAdapter = createStubAdapter("stripe", "Stripe");
