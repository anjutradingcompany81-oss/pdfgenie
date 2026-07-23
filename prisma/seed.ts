import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/password";
import { BUILT_IN_TEMPLATES } from "../lib/mail-merge/built-in-templates";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin seed. " +
        "Set them (e.g. in deploy-secrets.json on the VPS) and re-run `npm run db:seed`."
    );
    return;
  }

  const hashed = await hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { role: "ADMIN" },
    create: {
      email: email.toLowerCase(),
      name: "Admin",
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log(`Seeded admin account: ${admin.email}`);

  // Plan rows exist so future billing code has real IDs to reference — only
  // FREE is active. Limits/features actually enforced today live in
  // lib/plans/config.ts, not these rows.
  const plans = [
    { key: "FREE" as const, name: "Free", priceCents: 0, isActive: true },
    { key: "PREMIUM" as const, name: "Premium", priceCents: 0, isActive: false },
    { key: "ENTERPRISE" as const, name: "Enterprise", priceCents: 0, isActive: false },
  ];
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { key: plan.key },
      update: { name: plan.name, isActive: plan.isActive },
      create: plan,
    });
  }
  console.log(`Seeded plans: ${plans.map((p) => p.key).join(", ")}`);

  // Built-in templates (userId: null, isBuiltIn: true) are seeded by name —
  // re-running this script updates their content instead of duplicating them.
  for (const template of BUILT_IN_TEMPLATES) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { name: template.name, isBuiltIn: true },
    });
    if (existing) {
      await prisma.emailTemplate.update({
        where: { id: existing.id },
        data: { subject: template.subject, body: template.body },
      });
    } else {
      await prisma.emailTemplate.create({
        data: { ...template, isBuiltIn: true, userId: null },
      });
    }
  }
  console.log(`Seeded ${BUILT_IN_TEMPLATES.length} built-in email templates`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
