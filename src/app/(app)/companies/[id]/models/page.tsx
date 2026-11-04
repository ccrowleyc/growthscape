import { db } from "@/lib/db";
import { requireCompanyAccess } from "@/lib/company-access";
import { selectCompany } from "@/app/login/actions";
import { Button, Card } from "@/components/ui";

export default async function CompanyModelsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompanyAccess(id);
  const [models, kpis] = await Promise.all([
    db.valuationModel.findMany({ where: { companyId: id }, include: { _count: { select: { kpis: true, valuations: true } } }, orderBy: { name: "asc" } }),
    db.companyKpi.count({ where: { companyId: id } }),
  ]);
  const go = (next: string, label: string, variant: "primary" | "secondary" = "primary") => (
    <form action={selectCompany}>
      <input type="hidden" name="companyId" value={id} />
      <input type="hidden" name="next" value={next} />
      <Button variant={variant}>{label}</Button>
    </form>
  );
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">Valuation models turn {company.name}&apos;s KPIs into a valuation. A model can only use KPIs set up in step 1.</p>
      {kpis === 0 ? (
        <Card className="p-8 text-center text-sm text-ink-soft">Choose the company&apos;s KPIs first.</Card>
      ) : (
        <>
          {models.length > 0 && (
            <Card className="divide-y divide-line">
              {models.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                  <div><p className="font-medium">{m.name}</p><p className="text-xs text-ink-soft">{m._count.kpis} KPIs · {m._count.valuations} valuations</p></div>
                  {go(`/valuation-models/${m.id}`, "Open", "secondary")}
                </div>
              ))}
            </Card>
          )}
          {go("/valuation-models/new", models.length ? "Create another model" : "Create a valuation model")}
        </>
      )}
    </div>
  );
}
