import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { money } from "@/lib/format";
import { liveValue, parseInputs } from "@/lib/valuation";
import { Button, PageHeader } from "@/components/ui";
import { ValuationEditor } from "../ValuationEditor";
import { currentKpiValues, loadModels } from "../load-models";
import { deleteValuation } from "../actions";

export default async function ValuationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const { company } = await requireCompany();
  const v = await db.valuation.findFirst({ where: { id, companyId: company.id }, include: { model: true } });
  if (!v) notFound();
  const [models, currentValues] = await Promise.all([loadModels(company.id), currentKpiValues(company.id)]);
  const live = liveValue(v);

  return (
    <>
      <PageHeader
        title={v.name}
        description={`${v.kind === "TARGET" ? "Target" : "Point-in-time"} valuation using ${v.model.name}`}
        actions={
          <form action={deleteValuation}>
            <input type="hidden" name="id" value={v.id} />
            <Button variant="danger">Delete</Button>
          </form>
        }
      />
      {saved && <p className="mb-6 rounded-md bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">Valuation saved.</p>}
      {live.drift && (
        <p className="mb-6 rounded-md bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          {v.model.name} has changed since this was saved. It was {money(v.savedValue)} and is now {money(live.value)}. Save to confirm the new value.
        </p>
      )}
      <ValuationEditor
        key={v.updatedAt.toISOString()}
        models={models}
        currentValues={currentValues}
        initial={{ id: v.id, name: v.name, kind: v.kind, asOf: v.asOf.toISOString().slice(0, 10), modelId: v.modelId, notes: v.notes, inputs: parseInputs(v.inputs) }}
      />
    </>
  );
}
