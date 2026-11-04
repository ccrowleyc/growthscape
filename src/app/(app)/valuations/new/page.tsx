import { redirect } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ValuationEditor } from "../ValuationEditor";
import { currentKpiValues, loadModels } from "../load-models";

export default async function NewValuationPage({ searchParams }: { searchParams: Promise<{ modelId?: string }> }) {
  const { modelId } = await searchParams;
  const { company } = await requireCompany();
  const [models, currentValues] = await Promise.all([loadModels(company.id), currentKpiValues(company.id)]);
  if (!models.length) redirect("/valuations");
  return (
    <>
      <PageHeader title="New valuation" description="Pick a model and enter the KPIs. The valuation calculates as you type." />
      <ValuationEditor models={models} defaultModelId={modelId} currentValues={currentValues} />
    </>
  );
}
