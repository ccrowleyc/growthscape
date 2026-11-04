import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { money } from "@/lib/format";
import { analyse, loadPlans } from "@/lib/plan-load";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { PlanStatusBadge } from "@/components/PlanStatus";

export default async function PlansPage() {
  const { company } = await requireCompany();
  const [plans, targets] = await Promise.all([loadPlans(company.id), db.valuation.count({ where: { companyId: company.id, kind: "TARGET" } })]);

  return (
    <>
      <PageHeader title="Value Creation Plans" description="Check that your strategic initiatives add up to the target valuation." actions={plans.length > 0 && <LinkButton href="/plans/new">New plan</LinkButton>} />
      {plans.length === 0 ? (
        targets === 0 ? (
          <EmptyState title="Create a target valuation first" body="A plan starts from a point-in-time valuation and works towards a target valuation." action={<LinkButton href="/valuations/new">New valuation</LinkButton>} />
        ) : (
          <EmptyState title="No plans yet" body="Pick a starting valuation and a target, add your strategic initiatives, and see whether they get you there." action={<LinkButton href="/plans/new">Create a plan</LinkButton>} />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const a = analyse(p);
            return (
              <Link key={p.id} href={`/plans/${p.id}`}>
                <Card className="h-full p-5 transition hover:border-brand-500 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3"><h3 className="font-semibold">{p.name}</h3><PlanStatusBadge a={a} /></div>
                  <p className="mt-1 text-sm text-ink-soft">{p.initiatives.length} initiative{p.initiatives.length === 1 ? "" : "s"} · target {p.target.name}</p>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div><p className="text-xs text-ink-soft">Start</p><p className="font-medium tabular-nums">{money(a.baselineValue)}</p></div>
                    <div><p className="text-xs text-ink-soft">Projected</p><p className="font-medium tabular-nums">{money(a.projectedValue)}</p></div>
                    <div><p className="text-xs text-ink-soft">Target</p><p className="font-medium tabular-nums">{money(a.targetValue)}</p></div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
