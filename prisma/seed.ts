import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/password";

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
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
