"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, requireUser, setSession } from "@/lib/auth";

export type FormState = { error?: string } | undefined;

async function finishLogin(userId: string): Promise<never> {
  const memberships = await db.membership.findMany({ where: { userId } });
  if (memberships.length === 1) {
    await setSession(userId, memberships[0].companyId);
    redirect("/");
  }
  await setSession(userId);
  redirect("/select-company");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email) return { error: "Enter your email address." };

  const user = await db.user.findUnique({ where: { email } });
  if (user && !user.passwordHash) redirect(`/login/setup?email=${encodeURIComponent(email)}`);
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }
  return finishLogin(user.id);
}

export async function setupPassword(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== confirm) return { error: "Passwords don't match." };

  const user = await db.user.findUnique({ where: { email } });
  // Only accounts that have never had a password can be set up here.
  if (!user || user.passwordHash) return { error: "This account is already set up. Sign in instead." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(password, 12) } });
  return finishLogin(user.id);
}

export async function selectCompany(form: FormData) {
  const { user } = await requireUser();
  const companyId = String(form.get("companyId") ?? "");
  const m = await db.membership.findUnique({ where: { userId_companyId: { userId: user.id, companyId } } });
  if (!m) redirect("/select-company");
  await setSession(user.id, companyId);
  const next = String(form.get("next") ?? "/");
  redirect(next.startsWith("/") ? next : "/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
