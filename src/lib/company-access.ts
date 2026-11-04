import "server-only";
import { notFound } from "next/navigation";
import { db } from "./db";
import { requireUser } from "./auth";

/** The signed-in user's access to a company by id, or 404. */
export async function requireCompanyAccess(companyId: string, { edit = false } = {}) {
  const { user, session } = await requireUser();
  const m = await db.membership.findUnique({ where: { userId_companyId: { userId: user.id, companyId } }, include: { company: true } });
  if (!m) notFound();
  const canEdit = user.isAdmin || m.role === "ADMIN";
  if (edit && !canEdit) throw new Error("Not authorised for this company");
  return { user, company: m.company, canEdit, isCurrent: session.companyId === companyId };
}
