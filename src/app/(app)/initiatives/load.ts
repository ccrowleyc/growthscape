import { db } from "@/lib/db";
import { kpiCatalog } from "@/lib/kpi-catalog";

export async function loadEditorData(companyId: string) {
  const [owners, kpis] = await Promise.all([
    db.owner.findMany({ where: { companyId }, orderBy: { name: "asc" }, select: { id: true, name: true, title: true } }),
    kpiCatalog(companyId),
  ]);
  return { owners, kpis };
}
