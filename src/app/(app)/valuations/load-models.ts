import { db } from "@/lib/db";

export async function loadModels(companyId: string) {
  const models = await db.valuationModel.findMany({
    where: { companyId },
    include: { kpis: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  return models.map((m) => ({ id: m.id, name: m.name, formula: m.formula, kpis: m.kpis.map(({ code, name, kind, unit }) => ({ code, name, kind, unit })) }));
}
