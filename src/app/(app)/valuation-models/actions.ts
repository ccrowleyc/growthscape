"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { check } from "@/lib/formula";
import type { ActionState } from "@/components/ActionForm";

const Payload = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Model name is required."),
  description: z.string().trim().optional(),
  formula: z.string().trim().min(1, "Formula is required."),
  kpis: z.array(z.object({ code: z.string(), kind: z.enum(["PRIMARY", "COEFFICIENT"]) })).min(1, "Add at least one KPI."),
});

export async function saveModel(_: ActionState, form: FormData): Promise<ActionState> {
  const { company } = await requireCompany();
  let data: z.infer<typeof Payload>;
  try {
    const parsed = Payload.safeParse(JSON.parse(String(form.get("payload"))));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    data = parsed.data;
  } catch {
    return { error: "Couldn't read the form." };
  }
  const codes = data.kpis.map((k) => k.code);
  if (new Set(codes).size !== codes.length) return { error: "KPI codes must be unique." };
  const c = check(data.formula, codes);
  if (!c.ok) return { error: `Formula: ${c.error}` };

  const clash = await db.valuationModel.findFirst({ where: { companyId: company.id, name: data.name, NOT: data.id ? { id: data.id } : undefined } });
  if (clash) return { error: "A model with that name already exists." };

  // Models may only use KPIs that are set up for the company.
  const companyKpis = new Map((await db.companyKpi.findMany({ where: { companyId: company.id } })).map((k) => [k.code, k]));
  const unknown = data.kpis.filter((k) => !companyKpis.has(k.code));
  if (unknown.length) return { error: `Not a KPI for this company: ${unknown.map((k) => k.code).join(", ")}` };
  const kpis = data.kpis.map((k, i) => ({ code: k.code, kind: k.kind, name: companyKpis.get(k.code)!.name, unit: companyKpis.get(k.code)!.unit, sortOrder: i }));
  let id = data.id;
  if (id) {
    const existing = await db.valuationModel.findFirst({ where: { id, companyId: company.id } });
    if (!existing) return { error: "Model not found." };
    await db.$transaction([
      db.modelKpi.deleteMany({ where: { modelId: id } }),
      db.valuationModel.update({
        where: { id },
        data: { name: data.name, description: data.description || null, formula: data.formula, kpis: { create: kpis } },
      }),
    ]);
  } else {
    const m = await db.valuationModel.create({
      data: { companyId: company.id, name: data.name, description: data.description || null, formula: data.formula, kpis: { create: kpis } },
    });
    id = m.id;
  }
  revalidatePath("/valuation-models");
  revalidatePath("/valuations");
  redirect(`/valuation-models/${id}?saved=1`);
}

export async function deleteModel(form: FormData) {
  const { company } = await requireCompany();
  const id = String(form.get("id"));
  const m = await db.valuationModel.findFirst({ where: { id, companyId: company.id }, include: { _count: { select: { valuations: true } } } });
  if (!m || m._count.valuations > 0) return;
  await db.valuationModel.delete({ where: { id } });
  revalidatePath("/valuation-models");
  redirect("/valuation-models");
}
