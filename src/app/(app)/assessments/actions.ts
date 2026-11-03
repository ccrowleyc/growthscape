"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { PILLARS } from "@/lib/assessment";
import type { ActionState } from "@/components/ActionForm";

export async function createAssessment(_: ActionState, form: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  const name = String(form.get("name") ?? "").trim();
  const asOf = String(form.get("asOf") ?? "");
  if (!name) return { error: "Name is required." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) return { error: "Choose a date." };
  const a = await db.assessment.create({ data: { companyId: company.id, name, asOf: new Date(asOf + "T00:00:00Z") } });
  redirect(`/assessments/${a.id}`);
}

const Kpi = z.object({
  pillar: z.enum(PILLARS),
  name: z.string().trim().min(1, "Every KPI needs a name."),
  unit: z.enum(["CURRENCY", "PERCENT", "NUMBER"]),
  direction: z.enum(["HIGHER", "LOWER"]),
  target: z.number().nullable(),
  actual: z.number().nullable(),
  prior: z.number().nullable(),
  source: z.string().min(1),
  sourceDetail: z.string().nullable(),
});
const Payload = z.object({ id: z.string(), name: z.string().trim().min(1, "Assessment name is required."), kpis: z.array(Kpi) });

export async function saveAssessment(_: ActionState, form: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  let d: z.infer<typeof Payload>;
  try {
    const parsed = Payload.safeParse(JSON.parse(String(form.get("payload"))));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    d = parsed.data;
  } catch {
    return { error: "Couldn't read the form." };
  }
  if (!(await db.assessment.findFirst({ where: { id: d.id, companyId: company.id } }))) return { error: "Assessment not found." };
  await db.$transaction([
    db.assessmentKpi.deleteMany({ where: { assessmentId: d.id } }),
    db.assessment.update({ where: { id: d.id }, data: { name: d.name, kpis: { create: d.kpis.map((k, i) => ({ ...k, sortOrder: i })) } } }),
  ]);
  revalidatePath("/assessments");
  const step = Math.min(3, Math.max(1, Number(form.get("step")) || 1));
  redirect(`/assessments/${d.id}?step=${step}`);
}

export async function deleteAssessment(form: FormData) {
  const { company } = await requireCompany();
  await db.assessment.deleteMany({ where: { id: String(form.get("id")), companyId: company.id } });
  revalidatePath("/assessments");
  redirect("/assessments");
}
