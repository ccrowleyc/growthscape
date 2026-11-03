import { requireCompany } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { InitiativeEditor } from "../InitiativeEditor";
import { loadEditorData } from "../load";

export default async function NewInitiativePage() {
  const { company } = await requireCompany();
  const data = await loadEditorData(company.id);
  return (
    <>
      <PageHeader title="New strategic initiative" description="Name it, give it an owner, choose the KPIs it moves and plan its impact by quarter." />
      <InitiativeEditor {...data} />
    </>
  );
}
