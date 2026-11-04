import { db } from "./db";
import { monthOf } from "./kpis";

/** Record every KPI's current value as its snapshot for `month` (idempotent: re-running overwrites). */
export async function snapshotMonth(month: string, companyId?: string) {
  const kpis = await db.companyKpi.findMany({ where: { currentValue: { not: null }, ...(companyId ? { companyId } : {}) } });
  for (const k of kpis) {
    await db.kpiSnapshot.upsert({
      where: { kpiId_month: { kpiId: k.id, month } },
      update: { value: k.currentValue! },
      create: { kpiId: k.id, month, value: k.currentValue! },
    });
  }
  return kpis.length;
}

/** True on the last day of a month (UTC). */
export function isMonthEnd(now = new Date()) {
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  return tomorrow.getUTCMonth() !== now.getUTCMonth();
}

export { monthOf };
