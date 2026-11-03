import { db } from "./db";

export type CatalogKpi = { code: string; name: string; unit: string };

/** Every KPI defined across the company's valuation models, de-duplicated by code. */
export async function kpiCatalog(companyId: string): Promise<CatalogKpi[]> {
  const kpis = await db.modelKpi.findMany({ where: { model: { companyId } }, orderBy: [{ kind: "desc" }, { sortOrder: "asc" }] });
  const seen = new Map<string, CatalogKpi>();
  for (const k of kpis) if (!seen.has(k.code)) seen.set(k.code, { code: k.code, name: k.name, unit: k.unit });
  return [...seen.values()];
}
