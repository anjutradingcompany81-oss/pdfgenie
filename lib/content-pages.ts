import { prisma } from "@/lib/db";

export const CONTENT_SLUGS = ["faq", "privacy-policy", "terms", "contact", "about"] as const;
export type ContentSlug = (typeof CONTENT_SLUGS)[number];

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
