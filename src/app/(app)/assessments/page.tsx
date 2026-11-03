import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { analyse, type AKpi } from "@/lib/assessment";
import { ActionForm } from "@/components/ActionForm";
import { RAG_CLASS } from "@/components/Rag";
import { Card, Field, Input, PageHeader } from "@/components/ui";
import { createAssessment } from "./actions";

export default async function AssessmentsPage() {
  const { company } = await requireCompany();
  const list = await db.assessment.findMany({ where: { companyId: company.id }, include: { kpis: true }, orderBy: { asOf: "desc" } });
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="Assessments" description="Measure performance across the eight growth pillars." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {list.length === 0 ? (
            <Card className="p-8 text-center"><h3 className="font-semibold">No assessments yet</h3><p className="mt-1 text-sm text-ink-soft">Start one to choose KPIs, bring in the data and see how each pillar is performing.</p></Card>
          ) : list.map((a) => {
            const r = analyse(a.kpis as AKpi[]);
            return (
              <Link key={a.id} href={`/assessments/${a.id}?step=${r.overall === null ? (a.kpis.length ? 2 : 1) : 3}`}>
                <Card className="mb-3 flex items-center justify-between gap-4 p-5 transition hover:border-brand-500 hover:shadow-sm">
                  <div>
                    <h3 className="font-semibold">{a.name}</h3>
                    <p className="text-sm text-ink-soft">{a.asOf.toISOString().slice(0, 10)} · {a.kpis.length} KPIs across {new Set(a.kpis.map((k) => k.pillar)).size} pillars</p>
                  </div>
                  <span className={`text-2xl font-semibold tabular-nums ${RAG_CLASS[r.overallRag].text}`}>{r.overall === null ? "—" : `${Math.round(r.overall * 100)}%`}</span>
                </Card>
              </Link>
            );
          })}
        </div>
        <Card className="h-fit p-6">
          <h2 className="mb-5 text-base font-semibold">New assessment</h2>
          <ActionForm action={createAssessment} submit="Start assessment">
            <Field label="Name"><Input name="name" placeholder="e.g. Q4 2026 Assessment" required /></Field>
            <Field label="As of"><Input name="asOf" type="date" defaultValue={today} required /></Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
