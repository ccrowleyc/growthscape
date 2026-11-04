import { db } from "@/lib/db";

export async function setupStatus(companyId: string) {
  const [kpis, withValues, models, owners] = await Promise.all([
    db.companyKpi.count({ where: { companyId } }),
    db.companyKpi.count({ where: { companyId, currentValue: { not: null } } }),
    db.valuationModel.count({ where: { companyId } }),
    db.owner.count({ where: { companyId } }),
  ]);
  return {
    counts: { kpis, withValues, models, owners },
    done: { kpis: kpis > 0, "data-sources": kpis > 0 && withValues === kpis, models: models > 0, owners: owners > 0 },
  };
}
