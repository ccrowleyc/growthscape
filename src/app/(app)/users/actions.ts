"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { ActionState } from "@/components/ActionForm";

/** Companies the acting user administers: the only ones they may grant. */
async function grantableCompanyIds(userId: string) {
  const ms = await db.membership.findMany({ where: { userId, role: "ADMIN" } });
  return new Set(ms.map((m) => m.companyId));
}

function readAccess(form: FormData, grantable: Set<string>) {
  const ids = form.get("all") === "on" ? [...grantable] : form.getAll("companyIds").map(String).filter((id) => grantable.has(id));
  const role = form.get("role") === "ADMIN" ? "ADMIN" : "MEMBER";
  return { ids, role };
}

export async function createUser(_: ActionState, form: FormData): Promise<ActionState> {
  const { user: me } = await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name || !email) return { error: "Name and email are required." };
  if (password.length < 10) return { error: "Temporary password must be at least 10 characters." };
  if (await db.user.findUnique({ where: { email } })) return { error: "A user with that email already exists." };

  const { ids, role } = readAccess(form, await grantableCompanyIds(me.id));
  if (ids.length === 0) return { error: "Grant access to at least one company." };

  await db.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      createdById: me.id,
      memberships: { create: ids.map((companyId) => ({ companyId, role })) },
    },
  });
  revalidatePath("/users");
  return { ok: `${name} can now sign in with ${email}.` };
}

export async function updateAccess(_: ActionState, form: FormData): Promise<ActionState> {
  const { user: me } = await requireAdmin();
  const userId = String(form.get("userId"));
  if (userId === me.id) return { error: "You can't change your own access." };
  const grantable = await grantableCompanyIds(me.id);
  const { ids, role } = readAccess(form, grantable);

  // Only touch memberships in companies the acting admin controls.
  await db.$transaction([
    db.membership.deleteMany({ where: { userId, companyId: { in: [...grantable] } } }),
    ...ids.map((companyId) => db.membership.create({ data: { userId, companyId, role } })),
  ]);
  revalidatePath("/users");
  return { ok: "Access updated." };
}

export async function deleteUser(form: FormData) {
  const { user: me } = await requireAdmin();
  const userId = String(form.get("userId"));
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.id === me.id || target.createdById !== me.id) return;
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/users");
  redirect("/users");
}
