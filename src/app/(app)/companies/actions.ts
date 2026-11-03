"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin, requireUser, setSession } from "@/lib/auth";
import type { ActionState } from "@/components/ActionForm";

async function requireCompanyAdmin(companyId: string) {
  const { user } = await requireUser();
  const m = await db.membership.findUnique({ where: { userId_companyId: { userId: user.id, companyId } } });
  if (!m || (m.role !== "ADMIN" && !user.isAdmin)) throw new Error("Not authorised for this company");
  return user;
}

export async function createCompany(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Company name is required." };
  if (await db.company.findUnique({ where: { name } })) return { error: "A company with that name already exists." };
  const company = await db.company.create({
    data: { name, memberships: { create: { userId: user.id, role: "ADMIN" } } },
  });
  if (form.get("switch") === "on") await setSession(user.id, company.id);
  redirect(`/companies/${company.id}`);
}

export async function addOwner(_: ActionState, form: FormData): Promise<ActionState> {
  const companyId = String(form.get("companyId"));
  await requireCompanyAdmin(companyId);
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Owner name is required." };
  await db.owner.create({
    data: { companyId, name, title: String(form.get("title") ?? "").trim() || null, email: String(form.get("email") ?? "").trim() || null },
  });
  revalidatePath(`/companies/${companyId}`);
  return { ok: `${name} added.` };
}

export async function removeOwner(form: FormData) {
  const id = String(form.get("id"));
  const owner = await db.owner.findUnique({ where: { id } });
  if (!owner) return;
  await requireCompanyAdmin(owner.companyId);
  await db.owner.delete({ where: { id } });
  revalidatePath(`/companies/${owner.companyId}`);
}
