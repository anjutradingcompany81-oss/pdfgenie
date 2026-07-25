/**
 * Single source of truth for plan limits and feature availability.
 * Nothing in the app should hardcode a number like "30 emails" — it should
 * read PLAN_LIMITS.FREE.maxEmailsPerJob (or whatever the caller's resolved
 * plan is) instead, so raising a limit later is a one-line change here.
 *
 * Only FREE is actually enforced today (see lib/plans/get-current-plan.ts —
 * every request resolves to FREE until real subscriptions exist). PREMIUM
 * and ENTERPRISE are fully specified so the gating code has something real
 * to compare against once billing exists, but nothing grants them yet.
 */

export type PlanKey = "FREE" | "PREMIUM" | "ENTERPRISE";

export type PlanLimits = {
  /** -1 means unlimited. */
  maxEmailsPerJob: number;
  /** Applies per calendar day (UTC), per identifier. -1 means unlimited. */
  maxEmailsPerDay: number;
  maxExcelSizeMb: number;
  maxAttachmentsPerJob: number;
  maxAttachmentTotalSizeMb: number;
};

export type FeatureFlag =
  | "unlimitedEmailSending"
  | "scheduledCampaigns"
  | "bulkUploadsAboveLimit"
  | "advancedAnalytics"
  | "teamWorkspaces"
  | "multipleSenderAccounts"
  | "customBranding"
  | "apiAccess"
  | "automationWorkflows"
  | "emailTemplateLibrary"
  | "outlookIntegration"
  | "gmailOAuth"
  | "prioritySupport"
  | "sso"
  | "auditLogs"
  | "departmentManagement"
  | "multiUserAccess"
  | "dedicatedSupport";

export const PLAN_LIMITS: Record<PlanKey, PlanLimits> = {
  FREE: {
    maxEmailsPerJob: 30,
    maxEmailsPerDay: 30,
    maxExcelSizeMb: 10,
    maxAttachmentsPerJob: 30,
    maxAttachmentTotalSizeMb: 25,
  },
  PREMIUM: {
    maxEmailsPerJob: -1,
    maxEmailsPerDay: -1,
    maxExcelSizeMb: 100,
    maxAttachmentsPerJob: -1,
    maxAttachmentTotalSizeMb: 250,
  },
  ENTERPRISE: {
    maxEmailsPerJob: -1,
    maxEmailsPerDay: -1,
    maxExcelSizeMb: 500,
    maxAttachmentsPerJob: -1,
    maxAttachmentTotalSizeMb: 1000,
  },
};

export const PLAN_FEATURES: Record<PlanKey, FeatureFlag[]> = {
  FREE: [],
  PREMIUM: [
    "unlimitedEmailSending",
    "scheduledCampaigns",
    "bulkUploadsAboveLimit",
    "advancedAnalytics",
    "multipleSenderAccounts",
    "outlookIntegration",
    "gmailOAuth",
    "emailTemplateLibrary",
    "teamWorkspaces",
    "prioritySupport",
  ],
  ENTERPRISE: [
    "unlimitedEmailSending",
    "scheduledCampaigns",
    "bulkUploadsAboveLimit",
    "advancedAnalytics",
    "multipleSenderAccounts",
    "outlookIntegration",
    "gmailOAuth",
    "emailTemplateLibrary",
    "teamWorkspaces",
    "customBranding",
    "apiAccess",
    "automationWorkflows",
    "sso",
    "auditLogs",
    "departmentManagement",
    "multiUserAccess",
    "dedicatedSupport",
    "prioritySupport",
  ],
};

// Display names match the marketing tiers on the homepage pricing table
// (components/sections/Pricing.tsx) and Razorpay Dashboard plan names —
// PREMIUM/ENTERPRISE are the internal PlanKey values, "Pro"/"Team" are what
// the user actually sees and pays for.
export const PLAN_DISPLAY: Record<PlanKey, { name: string; tagline: string }> = {
  FREE: { name: "Free", tagline: "Standard mail merge, up to 30 emails per job" },
  PREMIUM: { name: "Pro", tagline: "Unlimited sending, scheduling, and integrations" },
  ENTERPRISE: { name: "Team", tagline: "Unlimited everything, team and org controls" },
};

export function hasFeature(plan: PlanKey, feature: FeatureFlag): boolean {
  return PLAN_FEATURES[plan].includes(feature);
}
