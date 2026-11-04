import { requireCompanyAccess } from "@/lib/company-access";
import { SetupTabs } from "@/components/SetupTabs";
import { PageHeader } from "@/components/ui";
import { setupStatus } from "./setup-status";

export default async function CompanyLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company } = await requireCompanyAccess(id);
  const { done } = await setupStatus(id);
  return (
    <>
      <PageHeader title={company.name} description="Company setup" />
      <SetupTabs companyId={id} done={done} />
      {children}
    </>
  );
}
