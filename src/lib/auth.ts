import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, cookieOptions, signSession, verifySession } from "./session";

export async function getSession() {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function setSession(userId: string, companyId?: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession({ userId, companyId }), cookieOptions);
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Current user, or redirect to login. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) redirect("/login");
  return { user, session };
}

/** Current user + selected company they still have access to, or redirect. */
export async function requireCompany() {
  const { user, session } = await requireUser();
  if (!session.companyId) redirect("/select-company");
  const membership = await db.membership.findUnique({
    where: { userId_companyId: { userId: user.id, companyId: session.companyId } },
    include: { company: true },
  });
  if (!membership) redirect("/select-company");
  return { user, company: membership.company, role: membership.role };
}

/** Requires a system administrator. */
export async function requireAdmin() {
  const ctx = await requireCompany();
  if (!ctx.user.isAdmin && ctx.role !== "ADMIN") redirect("/");
  return ctx;
}
