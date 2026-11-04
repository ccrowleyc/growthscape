import { db } from "./db";
import { PILLARS } from "./kpis";

export type CatalogKpi = { code: string; name: string; unit: string; pillar: string; currentValue: number | null };

/** The KPIs set up for a company, in pillar order. */
export async function kpiCatalog(companyId: string): Promise<CatalogKpi[]> {
  const kpis = await db.companyKpi.findMany({ where: { companyId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  const order = (p: string) => PILLARS.indexOf(p as (typeof PILLARS)[number]);
  return kpis
    .sort((a, b) => order(a.pillar) - order(b.pillar) || a.sortOrder - b.sortOrder)
    .map(({ code, name, unit, pillar, currentValue }) => ({ code, name, unit, pillar, currentValue }));
}
