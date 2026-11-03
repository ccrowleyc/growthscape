"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { compute } from "@/lib/formula";
import type { ActionState } from "@/components/ActionForm";

const Payload = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Valuation name is required."),
  kind: z.enum(["CURRENT", "TARGET"]),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  modelId: z.string().min(1, "Choose a valuation model."),
  notes: z.string().optional(),
  inputs: z.record(z.string(), z.number().nullable()),
});

export async function saveValuation(_: ActionState, form: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  let data: z.infer<typeof Payload>;
  try {
    const parsed = Payload.safeParse(JSON.parse(String(form.get("payload"))));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    data = parsed.data;
  } catch {
    return { error: "Couldn't read the form." };
  }
  const model = await db.valuationModel.findFirst({ where: { id: data.modelId, companyId: company.id }, include: { kpis: true } });
  if (!model) return { error: "Model not found." };

  const inputs = Object.fromEntries(model.kpis.map((k) => [k.code, data.inputs[k.code] ?? null]));
  const r = compute(model.formula, inputs);
  if ("error" in r) return { error: `Can't calculate yet: ${r.error}` };

  const clash = await db.valuation.findFirst({ where: { companyId: company.id, name: data.name, NOT: data.id ? { id: data.id } : undefined } });
  if (clash) return { error: "A valuation with that name already exists." };

  const fields = {
    name: data.name,
    kind: data.kind,
    asOf: new Date(data.asOf + "T00:00:00Z"),
    modelId: model.id,
    notes: data.notes?.trim() || null,
    inputs: JSON.stringify(inputs),
    savedValue: r.value,
  };
  let id = data.id;
  if (id) {
    const existing = await db.valuation.findFirst({ where: { id, companyId: company.id } });
    if (!existing) return { error: "Valuation not found." };
    await db.valuation.update({ where: { id }, data: fields });
  } else {
    id = (await db.valuation.create({ data: { ...fields, companyId: company.id } })).id;
  }
  revalidatePath("/valuations");
  redirect(`/valuations/${id}?saved=1`);
}

export async function deleteValuation(form: FormData) {
  const { company } = await requireCompany();
  const id = String(form.get("id"));
  await db.valuation.deleteMany({ where: { id, companyId: company.id } });
  revalidatePath("/valuations");
  redirect("/valuations");
}
