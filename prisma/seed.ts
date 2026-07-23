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
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
