import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { Button, Card, LinkButton, PageHeader } from "@/components/ui";
import type { ModelKpiDraft } from "@/lib/model-templates";
import { kpiCatalog } from "@/lib/kpi-catalog";
import { ModelEditor } from "../ModelEditor";
import { deleteModel } from "../actions";

export default async function ModelPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const { company } = await requireCompany();
  const model = await db.valuationModel.findFirst({
    where: { id, companyId: company.id },
    include: { kpis: { orderBy: { sortOrder: "asc" } }, valuations: { orderBy: { asOf: "asc" } } },
  });
  if (!model) notFound();
  const companyKpis = await kpiCatalog(company.id);

  return (
    <>
      <PageHeader
        title={model.name}
        description="Valuations using this model recalculate whenever you save changes here."
        actions={<LinkButton href={`/valuations/new?modelId=${model.id}`}>New valuation</LinkButton>}
      />
      {saved && <p className="mb-6 rounded-md bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">Model saved.</p>}
      <ModelEditor
        key={model.updatedAt.toISOString()}
        companyKpis={companyKpis}
        companyId={company.id}
        initial={{ id: model.id, name: model.name, description: model.description, formula: model.formula, kpis: model.kpis.map((k) => ({ code: k.code, kind: k.kind as ModelKpiDraft["kind"] })) }}
      />
      <Card className="mt-6 p-6">
        <h2 className="mb-3 text-base font-semibold">Valuations using this model</h2>
        {model.valuations.length === 0 ? (
          <p className="text-sm text-ink-soft">None yet.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {model.valuations.map((v) => (
              <li key={v.id}><Link href={`/valuations/${v.id}`} className="text-brand-700 hover:underline">{v.name}</Link></li>
            ))}
          </ul>
        )}
        {model.valuations.length === 0 && (
          <form action={deleteModel} className="mt-6 border-t border-line pt-4">
            <input type="hidden" name="id" value={model.id} />
            <Button variant="danger">Delete model</Button>
          </form>
        )}
      </Card>
    </>
  );
}
