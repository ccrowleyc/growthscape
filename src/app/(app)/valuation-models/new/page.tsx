import { requireCompany } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ModelEditor } from "../ModelEditor";

export default async function NewModelPage() {
  await requireCompany();
  return (
    <>
      <PageHeader title="New valuation model" description="Choose the KPIs, then write the formula that turns them into a valuation." />
      <ModelEditor />
    </>
  );
}
