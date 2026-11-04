import { db } from "@/lib/db";
import { requireCompanyAccess } from "@/lib/company-access";
import { SourceSetup } from "./SourceSetup";

export default async function DataSourcesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; updated?: string }> }) {
  const [{ id }, { saved, updated }] = await Promise.all([params, searchParams]);
  const { canEdit } = await requireCompanyAccess(id);
  const kpis = await db.companyKpi.findMany({ where: { companyId: id }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      {updated && <p className="mb-4 rounded-md bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">Data sources saved.</p>}
      {saved && <p className="mb-4 rounded-md bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">KPIs saved. Now choose where each one&apos;s data comes from.</p>}
      <SourceSetup
        key={kpis.map((k) => k.updatedAt.getTime()).join()}
        companyId={id}
        canEdit={canEdit}
        initial={kpis.map((k) => ({
          id: k.id, pillar: k.pillar, code: k.code, name: k.name, unit: k.unit, target: k.target, source: k.source, sourceDetail: k.sourceDetail,
          currentValue: k.currentValue, currentAsOf: k.currentAsOf ? k.currentAsOf.toISOString().slice(0, 10) : null,
        }))}
      />
    </>
  );
}
