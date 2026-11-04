import { db } from "@/lib/db";
import { requireCompanyAccess } from "@/lib/company-access";
import { KpiSetup } from "./KpiSetup";

export default async function KpisPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const { canEdit } = await requireCompanyAccess(id);
  const kpis = await db.companyKpi.findMany({ where: { companyId: id }, orderBy: { sortOrder: "asc" } });
  return (
    <>
    {saved && <p className="mb-4 rounded-md bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">KPIs saved.</p>}
    <KpiSetup
      key={kpis.map((k) => k.updatedAt.getTime()).join()}
      companyId={id}
      canEdit={canEdit}
      initial={kpis.map(({ id, pillar, code, name, unit, direction, target, source }) => ({ id, pillar, code, name, unit, direction, target, source }))}
    />
    </>
  );
}
