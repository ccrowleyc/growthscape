import { db } from "@/lib/db";
import { liveValue } from "@/lib/valuation";

export async function loadPlanEditorData(companyId: string) {
  const [vals, inits] = await Promise.all([
    db.valuation.findMany({ where: { companyId }, include: { model: { include: { kpis: { orderBy: { sortOrder: "asc" } } } } }, orderBy: { asOf: "asc" } }),
    db.strategicInitiative.findMany({ where: { companyId }, include: { owner: true }, orderBy: { name: "asc" } }),
  ]);
  return {
    valuations: vals.map((v) => ({ id: v.id, name: v.name, kind: v.kind, value: liveValue(v).value, kpis: v.model.kpis.map(({ code, name, unit }) => ({ code, name, unit })) })),
    initiatives: inits.map((i) => ({ id: i.id, name: i.name, owner: i.owner?.name ?? null })),
  };
}
