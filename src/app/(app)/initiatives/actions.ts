"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { compare, range } from "@/lib/quarters";
import type { ActionState } from "@/components/ActionForm";

const Q = z.string().regex(/^\d{4}-Q[1-4]$/);
const Payload = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Initiative name is required."),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  budget: z.number().nullable().optional(),
  startQuarter: Q,
  endQuarter: Q,
  kpiCodes: z.array(z.string()).min(1, "Choose at least one KPI the initiative will move."),
  cells: z.array(z.object({ quarter: Q, kpiCode: z.string(), planned: z.number().nullable(), actual: z.number().nullable() })),
});

export async function saveInitiative(_: ActionState, form: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  let d: z.infer<typeof Payload>;
  try {
    const parsed = Payload.safeParse(JSON.parse(String(form.get("payload"))));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    d = parsed.data;
  } catch {
    return { error: "Couldn't read the form." };
  }
  if (compare(d.endQuarter, d.startQuarter) < 0) return { error: "The end quarter must be after the start quarter." };
  if (d.ownerId && !(await db.owner.findFirst({ where: { id: d.ownerId, companyId: company.id } }))) return { error: "Choose a valid owner." };
  const clash = await db.strategicInitiative.findFirst({ where: { companyId: company.id, name: d.name, NOT: d.id ? { id: d.id } : undefined } });
  if (clash) return { error: "An initiative with that name already exists." };

  const quarters = new Set(range(d.startQuarter, d.endQuarter));
  const codes = new Set(d.kpiCodes);
  const cells = d.cells.filter((c) => quarters.has(c.quarter) && codes.has(c.kpiCode) && (c.planned !== null || c.actual !== null));

  const fields = {
    name: d.name,
    description: d.description?.trim() || null,
    ownerId: d.ownerId || null,
    budget: d.budget ?? null,
    startQuarter: d.startQuarter,
    endQuarter: d.endQuarter,
    kpiCodes: JSON.stringify(d.kpiCodes),
  };
  let id = d.id;
  if (id) {
    if (!(await db.strategicInitiative.findFirst({ where: { id, companyId: company.id } }))) return { error: "Initiative not found." };
    await db.$transaction([
      db.initiativeAdjustment.deleteMany({ where: { initiativeId: id } }),
      db.strategicInitiative.update({ where: { id }, data: { ...fields, adjustments: { create: cells } } }),
    ]);
  } else {
    id = (await db.strategicInitiative.create({ data: { ...fields, companyId: company.id, adjustments: { create: cells } } })).id;
  }
  revalidatePath("/initiatives");
  revalidatePath("/plans");
  redirect(`/initiatives/${id}?saved=1`);
}

export async function deleteInitiative(form: FormData) {
  const { company } = await requireCompany();
  await db.strategicInitiative.deleteMany({ where: { id: String(form.get("id")), companyId: company.id } });
  revalidatePath("/initiatives");
  redirect("/initiatives");
}
