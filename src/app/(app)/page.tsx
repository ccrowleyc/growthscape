import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { formatKpi } from "@/lib/format";
import { PILLARS, analyse, attainment, better, monthLabel, monthOf, rag, sourceLabel } from "@/lib/kpis";
import { RAG_CLASS, ScoreBar } from "@/components/Rag";
import { Sparkline } from "@/components/Sparkline";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function Dashboard() {
  const { company } = await requireCompany();
  const kpis = await db.companyKpi.findMany({
    where: { companyId: company.id },
    include: { snapshots: { orderBy: { month: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  const name = company.name.replace(/\.$/, "");

  if (kpis.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" description={`KPI trends for ${name}.`} />
        <EmptyState
          title="Set up this company's KPIs"
          body="Choose the KPIs that best fit the company and connect their data sources. Trends appear here as month-end snapshots build up."
          action={<LinkButton href={`/companies/${company.id}/kpis`}>Set up KPIs</LinkButton>}
        />
      </>
    );
  }

  const thisMonth = monthOf(new Date());
  const result = analyse(kpis);
  const series = (k: (typeof kpis)[number]) => {
    const pts = k.snapshots.slice(-24).map((s) => ({ month: s.month, value: s.value }));
    if (k.currentValue !== null && pts.at(-1)?.month !== thisMonth) pts.push({ month: thisMonth, value: k.currentValue });
    return pts.slice(-24);
  };
  const lastSnap = kpis.flatMap((k) => k.snapshots.map((s) => s.month)).sort().at(-1);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${name} · ${kpis.length} KPIs${lastSnap ? ` · last month-end snapshot ${monthLabel(lastSnap)}` : ""}`}
        actions={<LinkButton href={`/companies/${company.id}/data-sources`} variant="secondary">Update KPI values</LinkButton>}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-[260px_1fr]">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Overall score</p>
          <p className={`mt-1 text-4xl font-semibold tabular-nums tracking-tight ${RAG_CLASS[result.overallRag].text}`}>{result.overall === null ? "—" : `${Math.round(result.overall * 100)}%`}</p>
          <p className="text-sm text-ink-soft">of target, averaged across pillars</p>
          {result.missing > 0 && <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">{result.missing} KPI{result.missing === 1 ? " has" : "s have"} no current value.</p>}
          <div className="mt-6 space-y-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Needs attention</p>
            {result.weakest.length === 0 ? <p className="text-ink-soft">Set targets to see this.</p> : result.weakest.map(({ k, a }) => (
              <div key={k.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{k.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${RAG_CLASS[rag(a)].chip}`}>{Math.round(a! * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Performance by pillar</h2>
          <div className="space-y-3">
            {result.pillars.map((p) => (
              <a key={p.pillar} href={`#${p.pillar.replace(/\W+/g, "-")}`} className="grid grid-cols-[minmax(0,190px)_1fr_56px] items-center gap-4 text-sm hover:opacity-80">
                <span className="truncate">{p.pillar}</span>
                <ScoreBar score={p.score} rag={p.rag} />
                <span className={`text-right font-medium tabular-nums ${RAG_CLASS[p.rag].text}`}>{p.score === null ? "—" : `${Math.round(p.score * 100)}%`}</span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-soft">Score is the current value against target (inverted where lower is better), capped at 150%. The tick marks the target.</p>
        </Card>
      </div>

      {PILLARS.map((pillar) => {
        const list = kpis.filter((k) => k.pillar === pillar);
        if (!list.length) return null;
        return (
          <section key={pillar} id={pillar.replace(/\W+/g, "-")} className="mb-8 scroll-mt-24">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">{pillar}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((k) => {
                const pts = series(k);
                const prev = pts.length >= 2 ? pts[pts.length - 2] : null;
                const dir = prev && k.currentValue !== null ? better(k.direction, prev.value, k.currentValue) : null;
                const r = rag(attainment(k));
                return (
                  <Card key={k.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><h3 className="truncate text-sm font-medium">{k.name}</h3><p className="text-[11px] text-ink-faint">{sourceLabel(k.source)}</p></div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${RAG_CLASS[r].chip}`}>{RAG_CLASS[r].label}</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-semibold tabular-nums tracking-tight">{formatKpi(k.currentValue, k.unit)}</span>
                      {dir && dir !== "flat" && prev && k.currentValue !== null && (
                        <span className={`text-xs font-medium ${dir === "up" ? "text-emerald-600" : "text-red-600"}`}>
                          {k.currentValue > prev.value ? "▲" : "▼"} {formatKpi(Math.abs(k.currentValue - prev.value), k.unit)}
                        </span>
                      )}
                    </div>
                    <p className="mb-3 text-xs text-ink-soft">Target {formatKpi(k.target, k.unit)}{prev ? ` · vs ${monthLabel(prev.month)}` : ""}</p>
                    <Sparkline points={pts} unit={k.unit} target={k.target} />
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
      <p className="text-xs text-ink-soft">Trends use month-end snapshots plus the latest value. <Link href={`/companies/${company.id}/kpis`} className="underline">Change KPIs</Link></p>
    </>
  );
}
