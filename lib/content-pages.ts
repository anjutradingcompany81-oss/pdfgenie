import { prisma } from "@/lib/db";
import { CONTENT_SLUGS, type ContentSlug } from "@/lib/content-slugs";

export { CONTENT_SLUGS, type ContentSlug };

const DEFAULTS: Record<ContentSlug, { title: string; body: string }> = {
  faq: {
    title: "Frequently asked questions",
    body: "Is PDF Genie free? Yes.\n\nDo you store my files? No — every tool runs in your browser and your files never leave your device.",
  },
  "privacy-policy": {
    title: "Privacy Policy",
    body: "PDF Genie's tools run entirely in your browser. Your files are never uploaded to our servers. If you create an account, we store your name, email, and a securely hashed password.",
  },
  terms: {
    title: "Terms & Conditions",
    body: "By using PDF Genie you agree to use the service lawfully and not to abuse it. The service is provided as-is, without warranty.",
  },
  "refund-policy": {
    title: "Cancellation & Refund Policy",
    body: `Pro (₹999/month) and Team (₹2,999/month) are billed monthly through Razorpay.

Refunds: If you're on your first billing cycle of a paid plan and you're not satisfied, email us within 7 days of that first charge and we'll issue a full refund. Refunds are not available for renewal charges (your second month onward on the same subscription) or for Free-plan usage.

Cancelling: You can cancel anytime from your dashboard. When you cancel, you keep Pro/Team access through the end of the period you already paid for — there's no partial-period refund, and you won't be charged again after that. Your account then moves to the Free plan automatically.

To request a refund or get help with billing, email anjutradingcompany81@gmail.com with your account email and the approximate date of the charge.`,
  },
  contact: {
    title: "Contact us",
    body: "Questions or feedback? Reach us using the contact email listed in the site settings.",
  },
  about: {
    title: "About PDF Genie",
    body: "PDF Genie is a fast, privacy-first set of PDF tools that run entirely in your browser.",
  },
};

export async function getContentPage(slug: ContentSlug) {
  const existing = await prisma.contentPage.findUnique({ where: { slug } });
  if (existing) return existing;
  return DEFAULTS[slug];
}
