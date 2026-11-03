import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const COMPANIES = ["ABC Inc.", "XYZ Inc.", "ACME Inc."];
const ADMIN_EMAIL = "crowley.conor@gmail.com";

async function main() {
  // Password is never hard-coded. Set ADMIN_PASSWORD to seed one,
  // otherwise the admin chooses it on first login.
  const pw = process.env.ADMIN_PASSWORD;
  const passwordHash = pw ? await bcrypt.hash(pw, 12) : null;

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { email: ADMIN_EMAIL, name: "Conor Crowley", isAdmin: true, passwordHash },
  });

  for (const name of COMPANIES) {
    const company = await prisma.company.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.membership.upsert({
      where: { userId_companyId: { userId: admin.id, companyId: company.id } },
      update: { role: "ADMIN" },
      create: { userId: admin.id, companyId: company.id, role: "ADMIN" },
    });
  }
  console.log(`Seeded ${COMPANIES.length} companies and admin ${ADMIN_EMAIL}`);
}

main().finally(() => prisma.$disconnect());
