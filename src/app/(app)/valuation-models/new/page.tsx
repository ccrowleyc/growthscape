import { requireCompany } from "@/lib/auth";
import { kpiCatalog } from "@/lib/kpi-catalog";
import { PageHeader } from "@/components/ui";
import { ModelEditor } from "../ModelEditor";

export default async function NewModelPage() {
  const { company } = await requireCompany();
  const companyKpis = await kpiCatalog(company.id);
  return (
    <>
      <PageHeader title="New valuation model" description="Choose the KPIs, then write the formula that turns them into a valuation." />
      <ModelEditor companyKpis={companyKpis} companyId={company.id} />
    </>
  );
}
