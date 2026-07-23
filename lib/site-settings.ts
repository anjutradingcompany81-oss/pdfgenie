import { prisma } from "@/lib/db";

/** Single-row settings table — id is always 1. Creates sane defaults on first read. */
export async function getSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.siteSettings.create({ data: { id: 1 } });
}
