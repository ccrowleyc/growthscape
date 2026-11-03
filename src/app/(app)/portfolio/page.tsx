import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { analyse as analyseAssessment, type AKpi } from "@/lib/assessment";
import { money } from "@/lib/format";
import { initiativeStatus } from "@/lib/initiative-status";
import { analyse as analysePlan, loadPlans } from "@/lib/plan-load";
import { liveValue } from "@/lib/valuation";
import { selectCompany } from "@/app/login/actions";
import { RAG_CLASS } from "@/components/Rag";
import { PlanStatusBadge } from "@/components/PlanStatus";
import { Card, PageHeader } from "@/components/ui";

export default async function PortfolioPage() {
  const { user } = await requireCompany();
  const memberships = await db.membership.findMany({ where: { userId: user.id }, include: { company: true }, orderBy: { company: { name: "asc" } } });

  const rows = await Promise.all(
    memberships.map(async ({ company }) => {
      const [vals, plans, inits, assessment] = await Promise.all([
        db.valuation.findMany({ where: { companyId: company.id }, include: { model: true }, orderBy: { asOf: "asc" } }),
        loadPlans(company.id),
        db.strategicInitiative.findMany({ where: { companyId: company.id }, include: { adjustments: true } }),
        db.assessment.findFirst({ where: { companyId: company.id }, include: { kpis: true }, orderBy: { asOf: "desc" } }),
      ]);
      const current = vals.filter((v) => v.kind === "CURRENT").at(-1);
      const target = vals.filter((v) => v.kind === "TARGET").at(-1);
      const cv = current ? liveValue(current).value : null;
      const tv = target ? liveValue(target).value : null;
      const plan = plans[0] ? { p: plans[0], a: analysePlan(plans[0]) } : null;
      const behind = inits.filter((i) => initiativeStatus(i.adjustments).behind > 0).length;
      const score = assessment ? analyseAssessment(assessment.kpis as AKpi[]) : null;
      return { company, cv, tv, plan, inits: inits.length, behind, score };
    }),
  );

  const totalCurrent = rows.reduce((s, r) => s + (r.cv ?? 0), 0);
  const totalTarget = rows.reduce((s, r) => s + (r.tv ?? 0), 0);
  const max = Math.max(1, ...rows.map((r) => Math.max(r.cv ?? 0, r.tv ?? 0, r.plan?.a.projectedValue ?? 0)));

  return (
    <>
      <PageHeader title="Portfolio Views" description="Valuations, plans and performance across every company you can access." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Portfolio value today", money(totalCurrent), `${rows.filter((r) => r.cv !== null).length} of ${rows.length} companies valued`],
          ["Portfolio target", money(totalTarget), `${rows.filter((r) => r.tv !== null).length} of ${rows.length} companies with a target`],
          ["Value to create", money(totalTarget - totalCurrent), totalCurrent ? `${(((totalTarget - totalCurrent) / totalCurrent) * 100).toFixed(0)}% uplift` : "—"],
        ].map(([l, v, s]) => (
          <Card key={l} className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{l}</p><p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{v}</p><p className="mt-0.5 text-xs text-ink-soft">{s}</p></Card>
        ))}
      </div>

      <Card className="mb-6 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Current, projected and target valuation</h2>
          <div className="flex gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ink/70" />Current</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-500" />Projected by plan</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-ink" />Target</span>
          </div>
        </div>
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.company.id} className="grid grid-cols-[120px_1fr] items-center gap-4 text-sm sm:grid-cols-[160px_1fr_90px]">
              <span className="truncate font-medium">{r.company.name}</span>
              <div className="relative h-7">
                {r.plan?.a.projectedValue != null && <div className="absolute top-0 h-3 rounded-sm bg-brand-500" style={{ width: `${(r.plan.a.projectedValue / max) * 100}%` }} />}
                {r.cv !== null && <div className="absolute bottom-0 h-3 rounded-sm bg-ink/70" style={{ width: `${(r.cv / max) * 100}%` }} />}
                {r.tv !== null && <div className="absolute -top-0.5 h-8 w-0.5 bg-ink" style={{ left: `${(r.tv / max) * 100}%` }} title={`Target ${money(r.tv)}`} />}
                {r.cv === null && r.tv === null && <span className="text-xs text-ink-faint">No valuations yet</span>}
              </div>
              <span className="hidden text-right tabular-nums text-ink-soft sm:block">{money(r.cv)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-line bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
            <tr><th className="px-5 py-3">Company</th><th className="px-4 py-3 text-right">Current</th><th className="px-4 py-3 text-right">Target</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Initiatives</th><th className="px-4 py-3">Assessment</th><th className="px-5 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.company.id}>
                <td className="px-5 py-3.5 font-medium">{r.company.name}</td>
                <td className="px-4 py-3.5 text-right tabular-nums">{money(r.cv)}</td>
                <td className="px-4 py-3.5 text-right tabular-nums">{money(r.tv)}</td>
                <td className="px-4 py-3.5">{r.plan ? <span className="flex items-center gap-2"><PlanStatusBadge a={r.plan.a} /><span className="truncate text-xs text-ink-soft">{r.plan.p.name}</span></span> : <span className="text-ink-faint">—</span>}</td>
                <td className="px-4 py-3.5">{r.inits === 0 ? <span className="text-ink-faint">—</span> : <span>{r.inits}{r.behind > 0 && <span className="ml-1.5 text-xs font-medium text-red-600">{r.behind} behind</span>}</span>}</td>
                <td className="px-4 py-3.5">{r.score?.overall != null ? <span className={`font-medium tabular-nums ${RAG_CLASS[r.score.overallRag].text}`}>{Math.round(r.score.overall * 100)}%</span> : <span className="text-ink-faint">—</span>}</td>
                <td className="px-5 py-3.5 text-right">
                  <form action={selectCompany}>
                    <input type="hidden" name="companyId" value={r.company.id} />
                    <input type="hidden" name="next" value="/valuations" />
                    <button className="text-sm font-medium text-brand-700 hover:underline">Open</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-ink-soft">Uses each company&apos;s latest current and target valuation, most recently updated plan and latest assessment. <Link href="/companies" className="underline">Manage companies</Link></p>
    </>
  );
}
