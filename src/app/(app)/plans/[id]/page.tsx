import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { formatKpi, money } from "@/lib/format";
import { initiativeStatus } from "@/lib/initiative-status";
import { analyse, loadPlan } from "@/lib/plan-load";
import { label } from "@/lib/quarters";
import { Button, Card, PageHeader } from "@/components/ui";
import { PlanStatusBadge, planSentence } from "@/components/PlanStatus";
import { ValuationWalk } from "@/components/ValuationWalk";
import { PlanEditor } from "../PlanEditor";
import { loadPlanEditorData } from "../load";
import { deletePlan } from "../actions";

function Signed({ v, unit }: { v: number; unit: string }) {
  if (!v) return <span className="text-ink-faint">—</span>;
  return <span className={v > 0 ? "text-emerald-600" : "text-red-600"}>{v > 0 ? "+" : "−"}{formatKpi(Math.abs(v), unit)}</span>;
}

export default async function PlanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const { company } = await requireCompany();
  const plan = await loadPlan(company.id, id);
  if (!plan) notFound();
  const a = analyse(plan);
  const kpis = Object.fromEntries(plan.target.model.kpis.map((k) => [k.code, k]));
  const editor = await loadPlanEditorData(company.id);

  // Each initiative's contribution: projected value with it, minus without it.
  const allIds = plan.initiatives.map((pi) => pi.initiativeId);
  const contributions = plan.initiatives.map((pi) => {
    const without = analyse(plan, allIds.filter((x) => x !== pi.initiativeId)).projectedValue;
    return { i: pi.initiative, value: a.projectedValue !== null && without !== null ? a.projectedValue - without : null, status: initiativeStatus(pi.initiative.adjustments) };
  });
  const monitorGap = a.actualValueToDate !== null && a.plannedValueToDate !== null ? a.actualValueToDate - a.plannedValueToDate : null;

  return (
    <>
      <PageHeader
        title={plan.name}
        description={plan.description ?? `${plan.baseline.name} → ${plan.target.name}`}
        actions={<form action={deletePlan}><input type="hidden" name="id" value={plan.id} /><Button variant="danger">Delete</Button></form>}
      />
      {saved && <p className="mb-6 rounded-md bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">Plan saved.</p>}

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center gap-3"><PlanStatusBadge a={a} /><p className="text-sm">{planSentence(a, plan.marginPct)}</p></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            ["Starting valuation", money(a.baselineValue), plan.baseline.name],
            ["Projected valuation", money(a.projectedValue), "Start + initiatives + adjustments"],
            ["Target valuation", money(a.targetValue), plan.target.name],
            ["Gap to target", a.gap === null ? "—" : `${a.gap >= 0 ? "+" : "−"}${money(Math.abs(a.gap))}`, a.gapPct === null ? "" : `${a.gapPct < 0 ? "−" : "+"}${Math.abs(a.gapPct * 100).toFixed(1)}% · margin ${+(plan.marginPct * 100).toFixed(2)}%`],
          ].map(([l, v, s]) => (
            <div key={l}><p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{l}</p><p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{v}</p><p className="truncate text-xs text-ink-soft">{s}</p></div>
          ))}
        </div>
      </Card>

      <Card className="mb-6 overflow-x-auto">
        <div className="px-6 pt-5"><h2 className="text-base font-semibold">KPI bridge</h2><p className="mt-0.5 text-sm text-ink-soft">How the initiatives move each KPI from the starting valuation towards the target.</p></div>
        <table className="mt-4 w-full min-w-[760px] text-sm">
          <thead className="border-y border-line bg-muted/50 text-right text-xs font-medium uppercase tracking-wide text-ink-soft">
            <tr><th className="px-6 py-3 text-left">KPI</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">Initiatives</th><th className="px-4 py-3">Other</th><th className="px-4 py-3">Projected</th><th className="px-4 py-3">Target</th><th className="px-6 py-3">vs target</th></tr>
          </thead>
          <tbody className="divide-y divide-line text-right tabular-nums">
            {a.rows.map((r) => {
              const unit = kpis[r.code]?.unit ?? "NUMBER";
              const diff = r.projected !== null && r.target !== null ? r.projected - r.target : null;
              return (
                <tr key={r.code}>
                  <td className="px-6 py-3 text-left font-medium">{kpis[r.code]?.name ?? r.code}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatKpi(r.baseline, unit)}</td>
                  <td className="px-4 py-3"><Signed v={r.initiatives} unit={unit} /></td>
                  <td className="px-4 py-3"><Signed v={r.other} unit={unit} /></td>
                  <td className="px-4 py-3 font-medium">{formatKpi(r.projected, unit)}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatKpi(r.target, unit)}</td>
                  <td className="px-6 py-3 text-ink-soft">{diff === null || diff === 0 ? "—" : `${diff > 0 ? "+" : "−"}${formatKpi(Math.abs(diff), unit)}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-base font-semibold">Initiatives</h2>
          <p className="mb-4 mt-0.5 text-sm text-ink-soft">Value each initiative adds to the projected valuation.</p>
          {contributions.length === 0 ? <p className="text-sm text-ink-soft">No initiatives in this plan yet.</p> : (
            <ul className="divide-y divide-line">
              {contributions.map(({ i, value, status }) => (
                <li key={i.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/initiatives/${i.id}`} className="font-medium hover:text-brand-700">{i.name}</Link>
                    <p className="text-xs text-ink-soft">
                      {i.owner?.name ?? "Unassigned"} · {label(i.startQuarter)} – {label(i.endQuarter)}
                      {status.behind > 0 && <span className="ml-1.5 font-medium text-red-600">· {status.behind} behind plan</span>}
                      {status.missing > 0 && <span className="ml-1.5 text-amber-600">· {status.missing} actuals due</span>}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums text-emerald-600">{value === null ? "—" : `${value >= 0 ? "+" : "−"}${money(Math.abs(value))}`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="text-base font-semibold">Monitoring</h2>
          <p className="mb-4 mt-0.5 text-sm text-ink-soft">Valuation implied by quarters that have ended, using actuals where entered.</p>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-ink-soft">Planned to date</p><p className="text-xl font-semibold tabular-nums">{money(a.plannedValueToDate)}</p></div>
            <div><p className="text-xs text-ink-soft">Actual to date</p><p className={`text-xl font-semibold tabular-nums ${monitorGap !== null && monitorGap < 0 ? "text-red-600" : ""}`}>{money(a.actualValueToDate)}</p></div>
          </div>
          {monitorGap !== null && Math.abs(monitorGap) >= 1 && (
            <p className={`mt-3 text-sm ${monitorGap < 0 ? "text-red-600" : "text-emerald-600"}`}>{monitorGap < 0 ? "Behind" : "Ahead of"} plan by {money(Math.abs(monitorGap))}</p>
          )}
          <h3 className="mb-1 mt-6 text-xs font-semibold uppercase tracking-wide text-ink-soft">Projected valuation, step by step</h3>
          <ValuationWalk steps={a.steps} />
        </Card>
      </div>

      <details className="group">
        <summary className="mb-4 cursor-pointer list-none text-base font-semibold"><span className="mr-2 inline-block transition group-open:rotate-90">›</span>Edit plan</summary>
        <PlanEditor
          key={plan.updatedAt.toISOString()}
          {...editor}
          initial={{
            id: plan.id, name: plan.name, description: plan.description, baselineValuationId: plan.baselineValuationId, targetValuationId: plan.targetValuationId,
            marginPct: plan.marginPct, initiativeIds: allIds, other: plan.otherAdjustments.map(({ label, kpiCode, amount }) => ({ label, kpiCode, amount })),
          }}
        />
      </details>
    </>
  );
}
