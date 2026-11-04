import Link from "next/link";
import { requireCompanyAccess } from "@/lib/company-access";
import { Card } from "@/components/ui";
import { setupStatus } from "./setup-status";

export default async function CompanySetupOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireCompanyAccess(id);
  const { counts, done } = await setupStatus(id);
  const steps = [
    { key: "kpis", title: "Choose KPIs", body: counts.kpis ? `${counts.kpis} KPIs across the eight pillars` : "Pick the KPIs that best fit this company across the eight growth pillars." },
    { key: "data-sources", title: "Connect data sources", body: counts.kpis ? `${counts.withValues} of ${counts.kpis} KPIs have a current value` : "Choose where each KPI's data comes from, such as HubSpot, Salesforce or Xero." },
    { key: "models", title: "Create valuation models", body: counts.models ? `${counts.models} model${counts.models === 1 ? "" : "s"}` : "Turn the company's KPIs into a valuation formula." },
    { key: "owners", title: "Add initiative owners", body: counts.owners ? `${counts.owners} owner${counts.owners === 1 ? "" : "s"}` : "The people who can own strategic initiatives." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {steps.map((s, i) => (
        <Link key={s.key} href={`/companies/${id}/${s.key}`}>
          <Card className="h-full p-5 transition hover:border-brand-500 hover:shadow-sm">
            <div className="flex items-start gap-3">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${done[s.key as keyof typeof done] ? "bg-brand-600 text-white" : "bg-muted text-ink-soft"}`}>
                {done[s.key as keyof typeof done] ? "✓" : i + 1}
              </span>
              <div><h3 className="text-sm font-semibold">{s.title}</h3><p className="mt-0.5 text-sm text-ink-soft">{s.body}</p></div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
