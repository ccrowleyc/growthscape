"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompanyAccess } from "@/lib/company-access";
import { PILLARS } from "@/lib/kpis";
import type { ActionState } from "@/components/ActionForm";

const Kpi = z.object({
  id: z.string().optional(),
  pillar: z.enum(PILLARS),
  code: z.string().trim().regex(/^[A-Z_][A-Z0-9_]*$/, "KPI codes use capital letters, digits and underscores."),
  name: z.string().trim().min(1, "Every KPI needs a name."),
  unit: z.enum(["CURRENCY", "PERCENT", "NUMBER"]),
  direction: z.enum(["HIGHER", "LOWER"]),
  target: z.number().nullable(),
  source: z.string().optional(),
});

function readJson<T extends z.ZodTypeAny>(schema: T, form: FormData): z.infer<T> | { error: string } {
  try {
    const parsed = schema.safeParse(JSON.parse(String(form.get("payload"))));
    return parsed.success ? parsed.data : { error: parsed.error.issues[0].message };
  } catch {
    return { error: "Couldn't read the form." };
  }
}

/** Step 1 of company setup: choose the company's KPIs and targets. */
export async function saveKpis(_: ActionState, form: FormData): Promise<ActionState> {
  const companyId = String(form.get("companyId"));
  await requireCompanyAccess(companyId, { edit: true });
  const d = readJson(z.array(Kpi), form);
  if ("error" in d) return d;
  const codes = d.map((k) => k.code);
  if (new Set(codes).size !== codes.length) return { error: "KPI codes must be unique." };

  const existing = await db.companyKpi.findMany({ where: { companyId } });
  const keep = new Set(d.map((k) => k.id).filter(Boolean));
  const removed = existing.filter((e) => !keep.has(e.id));
  if (removed.length) {
    const used = await db.modelKpi.findMany({ where: { code: { in: removed.map((r) => r.code) }, model: { companyId } }, include: { model: true } });
    if (used.length) {
      const u = used[0];
      return { error: `${removed.find((r) => r.code === u.code)?.name} is used in the valuation model “${u.model.name}”. Remove it from the model first.` };
    }
  }
  const renamedInUse = d.filter((k) => k.id && existing.find((e) => e.id === k.id && e.code !== k.code));
  if (renamedInUse.length) return { error: "A KPI's code can't change once it's saved." };

  await db.$transaction([
    db.companyKpi.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } }),
    ...d.map((k, i) => {
      const data = { pillar: k.pillar, name: k.name, unit: k.unit, direction: k.direction, target: k.target, sortOrder: i };
      return k.id
        ? db.companyKpi.update({ where: { id: k.id }, data })
        : db.companyKpi.create({ data: { ...data, companyId, code: k.code, source: k.source ?? "MANUAL" } });
    }),
  ]);
  revalidatePath(`/companies/${companyId}`, "layout");
  if (form.get("next") === "sources") redirect(`/companies/${companyId}/data-sources?saved=1`);
  redirect(`/companies/${companyId}/kpis?saved=1`);
}

const Source = z.object({ id: z.string(), source: z.string().min(1), sourceDetail: z.string().nullable(), currentValue: z.number().nullable() });

/** Step 2 of company setup: where each KPI's data comes from, and its latest value. */
export async function saveSources(_: ActionState, form: FormData): Promise<ActionState> {
  const companyId = String(form.get("companyId"));
  await requireCompanyAccess(companyId, { edit: true });
  const d = readJson(z.array(Source), form);
  if ("error" in d) return d;
  const existing = new Map((await db.companyKpi.findMany({ where: { companyId } })).map((k) => [k.id, k]));
  const now = new Date();
  await db.$transaction(
    d.filter((s) => existing.has(s.id)).map((s) => {
      const prev = existing.get(s.id)!;
      const changed = prev.currentValue !== s.currentValue;
      return db.companyKpi.update({
        where: { id: s.id },
        data: { source: s.source, sourceDetail: s.sourceDetail?.trim() || null, currentValue: s.currentValue, ...(changed ? { currentAsOf: s.currentValue === null ? null : now } : {}) },
      });
    }),
  );
  revalidatePath(`/companies/${companyId}`, "layout");
  revalidatePath("/");
  redirect(`/companies/${companyId}/data-sources?updated=1`);
}
