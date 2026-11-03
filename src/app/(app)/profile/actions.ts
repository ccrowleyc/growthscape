"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/components/ActionForm";

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };
  await db.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/", "layout");
  return { ok: "Profile updated." };
}

export async function changePassword(_: ActionState, form: FormData): Promise<ActionState> {
  const { user } = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!user.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) return { error: "Current password is incorrect." };
  if (next.length < 10) return { error: "Use at least 10 characters." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: "Password changed." };
}
