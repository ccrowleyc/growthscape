import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedDemo } from "./demo";

const prisma = new PrismaClient();

const COMPANIES = ["ABC Inc.", "XYZ Inc.", "ACME Inc."];
const ADMIN_EMAIL = "crowley.conor@gmail.com";
const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;

async function main() {
  // The password is never hard-coded. In production ADMIN_PASSWORD is required;
  // locally, leaving it empty lets the admin choose one on first sign-in.
  const pw = process.env.ADMIN_PASSWORD?.trim();
  if (isProduction && (!pw || pw.length < 10)) {
    throw new Error("Set ADMIN_PASSWORD (10+ characters) before deploying.");
  }
  const passwordHash = pw ? await bcrypt.hash(pw, 12) : null;

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  const admin = existing
    ? // Only fill in a password if the admin has never had one; never overwrite a changed password.
      existing.passwordHash || !passwordHash
      ? existing
      : await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } })
    : await prisma.user.create({ data: { email: ADMIN_EMAIL, name: "Conor Crowley", isAdmin: true, passwordHash } });

  for (const name of COMPANIES) {
    const company = await prisma.company.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.membership.upsert({
      where: { userId_companyId: { userId: admin.id, companyId: company.id } },
      update: { role: "ADMIN" },
      create: { userId: admin.id, companyId: company.id, role: "ADMIN" },
    });
  }
  const demo = await seedDemo(prisma, admin.id);
  console.log(`Seed checked: ${COMPANIES.length} companies and admin ${ADMIN_EMAIL}${demo ? "; created Demo Inc." : ""}`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
