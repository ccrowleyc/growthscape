"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import type { ActionState } from "@/components/ActionForm";

const Payload = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Plan name is required."),
  description: z.string().optional(),
  baselineValuationId: z.string().min(1, "Choose a starting valuation."),
  targetValuationId: z.string().min(1, "Choose a target valuation."),
  marginPct: z.number().min(0).max(100),
  initiativeIds: z.array(z.string()),
  other: z.array(z.object({ label: z.string().trim().min(1, "Every adjustment needs a label."), kpiCode: z.string().min(1, "Choose a KPI for every adjustment."), amount: z.number() })),
});

export async function savePlan(_: ActionState, form: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  let d: z.infer<typeof Payload>;
  try {
    const parsed = Payload.safeParse(JSON.parse(String(form.get("payload"))));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    d = parsed.data;
  } catch {
    return { error: "Couldn't read the form." };
  }
  if (d.baselineValuationId === d.targetValuationId) return { error: "The starting and target valuations must be different." };
  const vals = await db.valuation.count({ where: { companyId: company.id, id: { in: [d.baselineValuationId, d.targetValuationId] } } });
  if (vals !== 2) return { error: "Valuation not found." };
  const inits = await db.strategicInitiative.findMany({ where: { companyId: company.id, id: { in: d.initiativeIds } }, select: { id: true } });
  const clash = await db.valueCreationPlan.findFirst({ where: { companyId: company.id, name: d.name, NOT: d.id ? { id: d.id } : undefined } });
  if (clash) return { error: "A plan with that name already exists." };

  const fields = {
    name: d.name,
    description: d.description?.trim() || null,
    baselineValuationId: d.baselineValuationId,
    targetValuationId: d.targetValuationId,
    marginPct: d.marginPct / 100,
    initiatives: { create: inits.map((i) => ({ initiativeId: i.id })) },
    otherAdjustments: { create: d.other },
  };
  let id = d.id;
  if (id) {
    if (!(await db.valueCreationPlan.findFirst({ where: { id, companyId: company.id } }))) return { error: "Plan not found." };
    await db.$transaction([
      db.planInitiative.deleteMany({ where: { planId: id } }),
      db.planAdjustment.deleteMany({ where: { planId: id } }),
      db.valueCreationPlan.update({ where: { id }, data: fields }),
    ]);
  } else {
    id = (await db.valueCreationPlan.create({ data: { ...fields, companyId: company.id } })).id;
  }
  revalidatePath("/plans");
  redirect(`/plans/${id}?saved=1`);
}

export async function deletePlan(form: FormData) {
  const { company } = await requireCompany();
  await db.valueCreationPlan.deleteMany({ where: { id: String(form.get("id")), companyId: company.id } });
  revalidatePath("/plans");
  redirect("/plans");
}
