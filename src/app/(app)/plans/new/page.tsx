import { requireCompany } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { PlanEditor } from "../PlanEditor";
import { loadPlanEditorData } from "../load";

export default async function NewPlanPage() {
  const { company } = await requireCompany();
  return (
    <>
      <PageHeader title="New value creation plan" />
      <PlanEditor {...await loadPlanEditorData(company.id)} />
    </>
  );
}
