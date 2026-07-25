/**
 * An admin-granted plan (provider === null — see set-user-plan.ts) can
 * carry an expiration (the 30-day free trial) or not (a permanent manual
 * override, currentPeriodEnd left null). Real Razorpay subscriptions never
 * hit this path — their lifecycle is driven by webhook status flips
 * instead, not by comparing currentPeriodEnd to now.
 */
export function isAdminGrantExpired(subscription: {
  provider: string | null;
  currentPeriodEnd: Date | null;
}): boolean {
  return (
    subscription.provider === null &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd < new Date()
  );
}
