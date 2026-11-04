"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";
import { formatKpi } from "@/lib/format";
import { variance } from "@/lib/plan";
import { elapsed, label, pickerQuarters, quarterOf, range } from "@/lib/quarters";
import type { CatalogKpi } from "@/lib/kpi-catalog";
import { saveInitiative } from "./actions";
import { UnitInput } from "@/components/UnitInput";
import { AmountInput } from "@/components/AmountInput";

type Cell = { planned: number | null; actual: number | null };
type Initial = {
  id: string; name: string; description: string | null; ownerId: string | null; budget: number | null;
  startQuarter: string; endQuarter: string; kpiCodes: string[];
  cells: { quarter: string; kpiCode: string; planned: number | null; actual: number | null }[];
};

const SELECT = "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm";
const key = (q: string, c: string) => `${q}|${c}`;

export function InitiativeEditor({ owners, kpis, initial }: { owners: { id: string; name: string; title: string | null }[]; kpis: CatalogKpi[]; initial?: Initial }) {
  const [state, action, pending] = useActionState(saveInitiative, undefined);
  const now = quarterOf(new Date());
  const quarters = useMemo(() => pickerQuarters(), []);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [ownerId, setOwnerId] = useState(initial?.ownerId ?? "");
  const [budget, setBudget] = useState<number | null>(initial?.budget ?? null);
  const [start, setStart] = useState(initial?.startQuarter ?? now);
  const [end, setEnd] = useState(initial?.endQuarter ?? range(now, quarters[quarters.indexOf(now) + 3])[3]);
  const [codes, setCodes] = useState<string[]>(initial?.kpiCodes ?? []);
  const [cells, setCells] = useState<Record<string, Cell>>(() =>
    Object.fromEntries((initial?.cells ?? []).map((c) => [key(c.quarter, c.kpiCode), { planned: c.planned, actual: c.actual }])),
  );

  const period = useMemo(() => {
    try { return range(start, end); } catch { return []; }
  }, [start, end]);
  const selected = kpis.filter((k) => codes.includes(k.code));
  const setCell = (q: string, c: string, patch: Partial<Cell>) =>
    setCells((cs) => ({ ...cs, [key(q, c)]: { ...(cs[key(q, c)] ?? { planned: null, actual: null }), ...patch } }));

  const payload = JSON.stringify({
    id: initial?.id, name, description, ownerId, budget, startQuarter: start, endQuarter: end, kpiCodes: codes,
    cells: Object.entries(cells).map(([k, v]) => { const [quarter, kpiCode] = k.split("|"); return { quarter, kpiCode, ...v }; }),
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />
      <Card className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Initiative name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Create dedicated EMEA sales team" required /></Field>
          <Field label="Owner">
            {owners.length === 0 ? (
              <p className="rounded-md border border-dashed border-line px-3 py-2 text-sm text-ink-soft">No owners yet. <Link href="/companies" className="text-brand-700 underline">Add owners</Link> on the company page.</p>
            ) : (
              <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={SELECT}>
                <option value="">Unassigned</option>
                {owners.map((o) => <option key={o.id} value={o.id}>{o.name}{o.title ? ` · ${o.title}` : ""}</option>)}
              </select>
            )}
          </Field>
          <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" /></Field>
          <Field label="Budget (optional)">
            <div className="flex rounded-md border border-line bg-surface"><span className="grid place-items-center pl-3 text-sm text-ink-faint">€</span>
              <AmountInput value={budget} onChange={setBudget} className="px-3 py-2 text-sm" ariaLabel="Budget" />
            </div>
          </Field>
          <Field label="Start quarter">
            <select value={start} onChange={(e) => setStart(e.target.value)} className={SELECT}>{quarters.map((q) => <option key={q} value={q}>{label(q)}</option>)}</select>
          </Field>
          <Field label="End quarter">
            <select value={end} onChange={(e) => setEnd(e.target.value)} className={SELECT}>{quarters.map((q) => <option key={q} value={q}>{label(q)}</option>)}</select>
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">KPIs impacted</h2>
        <p className="mb-4 mt-0.5 text-sm text-ink-soft">Choose from the KPIs set up for this company.</p>
        {kpis.length === 0 ? (
          <p className="text-sm text-ink-soft">No KPIs yet. Set up the company&apos;s KPIs under <Link href="/companies" className="text-brand-700 underline">Companies</Link> first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {kpis.map((k) => {
              const on = codes.includes(k.code);
              return (
                <button type="button" key={k.code} onClick={() => setCodes(on ? codes.filter((c) => c !== k.code) : [...codes, k.code])}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-surface text-ink-soft hover:border-brand-500"}`}>
                  {k.name}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {selected.length > 0 && period.length > 0 && (
        <Card className="p-6">
          <h2 className="text-base font-semibold">Quarterly impact</h2>
          <p className="mb-5 mt-0.5 text-sm text-ink-soft">
            Enter the change each quarter adds to the KPI. Use percentage points (pts) for percent KPIs. Actuals open once a quarter has ended.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                  <th className="sticky left-0 w-28 bg-surface py-2 pr-4">Quarter</th>
                  {selected.map((k) => <th key={k.code} className="px-3 py-2 text-center">{k.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {period.map((q) => {
                  const past = elapsed(q);
                  return (
                    <tr key={q} className="align-top">
                      <td className="sticky left-0 border-t border-line bg-surface py-2 pr-4">
                        <p className="font-medium">{label(q)}</p>
                        <p className="text-xs text-ink-faint">{past ? "Ended" : q === now ? "Current" : "Upcoming"}</p>
                      </td>
                      {selected.map((k) => {
                        const c = cells[key(q, k.code)] ?? { planned: null, actual: null };
                        const v = variance(c.planned, c.actual);
                        const tone = v?.significant ? (v.behind ? "border-red-300 bg-red-50" : "border-emerald-300 bg-emerald-50") : undefined;
                        return (
                          <td key={k.code} className="border-t border-line px-3 py-2">
                            <div className="mx-auto w-40 space-y-1">
                            <div className="flex items-center gap-1.5"><span className="w-10 shrink-0 text-[11px] text-ink-faint">Plan</span><UnitInput size="sm" align="center" pctSuffix="pts" value={c.planned} unit={k.unit} ariaLabel={`${k.name} plan ${q}`} onChange={(n) => setCell(q, k.code, { planned: n })} /></div>
                            {past && (
                              <div className="flex items-center gap-1.5"><span className="w-10 shrink-0 text-[11px] text-ink-faint">Actual</span><UnitInput size="sm" align="center" pctSuffix="pts" value={c.actual} unit={k.unit} tone={tone} ariaLabel={`${k.name} actual ${q}`} onChange={(n) => setCell(q, k.code, { actual: n })} /></div>
                            )}
                            </div>
                            {v?.significant && (
                              <p className={`mt-1 text-center text-[11px] font-medium ${v.behind ? "text-red-600" : "text-emerald-600"}`}>
                                {v.behind ? "Behind" : "Ahead of"} plan by {formatKpi(Math.abs(v.diff), k.unit)}
                              </p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Button disabled={pending}>{pending ? "Saving…" : initial ? "Save initiative" : "Create initiative"}</Button>
        <ErrorText>{state?.error}</ErrorText>
      </div>
    </form>
  );
}
