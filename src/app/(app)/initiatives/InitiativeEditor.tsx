"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";
import { formatKpi } from "@/lib/format";
import { variance } from "@/lib/plan";
import { elapsed, label, pickerQuarters, quarterOf, range } from "@/lib/quarters";
import type { CatalogKpi } from "@/lib/kpi-catalog";
import { saveInitiative } from "./actions";

type Cell = { planned: number | null; actual: number | null };
type Initial = {
  id: string; name: string; description: string | null; ownerId: string | null; budget: number | null;
  startQuarter: string; endQuarter: string; kpiCodes: string[];
  cells: { quarter: string; kpiCode: string; planned: number | null; actual: number | null }[];
};

const SELECT = "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm";
const key = (q: string, c: string) => `${q}|${c}`;

function NumCell({ value, unit, onChange, tone }: { value: number | null; unit: string; onChange: (v: number | null) => void; tone?: string }) {
  const pct = unit === "PERCENT";
  const shown = value === null ? "" : pct ? +(value * 100).toFixed(6) : value;
  return (
    <div className={`flex items-center rounded border bg-surface ${tone ?? "border-line"}`}>
      <input
        type="number"
        step="any"
        value={shown}
        onChange={(e) => onChange(e.target.value === "" ? null : pct ? Number(e.target.value) / 100 : Number(e.target.value))}
        className="w-full min-w-0 bg-transparent px-2 py-1.5 text-right text-sm tabular-nums focus:outline-none"
      />
      {pct && <span className="pr-2 text-xs text-ink-faint">pts</span>}
    </div>
  );
}

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

  const totals = selected.map((k) => {
    const list = period.map((q) => cells[key(q, k.code)]);
    return {
      code: k.code,
      planned: list.reduce((s, c) => s + (c?.planned ?? 0), 0),
      plannedToDate: period.reduce((s, q) => s + (elapsed(q) ? cells[key(q, k.code)]?.planned ?? 0 : 0), 0),
      actualToDate: period.some((q) => elapsed(q) && cells[key(q, k.code)]?.actual != null)
        ? period.reduce((s, q) => s + (elapsed(q) ? cells[key(q, k.code)]?.actual ?? 0 : 0), 0)
        : null,
    };
  });

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
            <div className="flex rounded-md border border-line bg-surface"><span className="grid place-items-center pl-3 text-sm text-ink-faint">$</span>
              <input type="number" step="any" value={budget ?? ""} onChange={(e) => setBudget(e.target.value === "" ? null : Number(e.target.value))} className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none" />
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
        <p className="mb-4 mt-0.5 text-sm text-ink-soft">KPIs come from your valuation models.</p>
        {kpis.length === 0 ? (
          <p className="text-sm text-ink-soft">No KPIs yet. <Link href="/valuation-models/new" className="text-brand-700 underline">Create a valuation model</Link> first.</p>
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
            <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                  <th className="sticky left-0 bg-surface py-2 pr-4">Quarter</th>
                  {selected.map((k) => <th key={k.code} className="min-w-40 px-2 py-2 text-right">{k.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {period.map((q) => {
                  const past = elapsed(q);
                  return (
                    <tr key={q} className="align-top">
                      <td className="sticky left-0 border-t border-line bg-surface py-2.5 pr-4">
                        <p className="font-medium">{label(q)}</p>
                        <p className="text-xs text-ink-faint">{past ? "Ended" : q === now ? "Current" : "Upcoming"}</p>
                      </td>
                      {selected.map((k) => {
                        const c = cells[key(q, k.code)] ?? { planned: null, actual: null };
                        const v = variance(c.planned, c.actual);
                        const tone = v?.significant ? (v.behind ? "border-red-300 bg-red-50" : "border-emerald-300 bg-emerald-50") : undefined;
                        return (
                          <td key={k.code} className="space-y-1.5 border-t border-line px-2 py-2.5">
                            <div className="flex items-center gap-2"><span className="w-12 text-[11px] text-ink-faint">Plan</span><NumCell value={c.planned} unit={k.unit} onChange={(n) => setCell(q, k.code, { planned: n })} /></div>
                            {past && (
                              <div className="flex items-center gap-2"><span className="w-12 text-[11px] text-ink-faint">Actual</span><NumCell value={c.actual} unit={k.unit} tone={tone} onChange={(n) => setCell(q, k.code, { actual: n })} /></div>
                            )}
                            {v?.significant && (
                              <p className={`text-right text-[11px] font-medium ${v.behind ? "text-red-600" : "text-emerald-600"}`}>
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
              <tfoot>
                <tr className="text-sm">
                  <td className="sticky left-0 border-t-2 border-line bg-surface py-3 pr-4 font-semibold">Total</td>
                  {totals.map((t) => {
                    const k = selected.find((s) => s.code === t.code)!;
                    const v = variance(t.plannedToDate || null, t.actualToDate);
                    return (
                      <td key={t.code} className="border-t-2 border-line px-2 py-3 text-right">
                        <p className="font-semibold tabular-nums">{formatKpi(t.planned, k.unit)}</p>
                        {t.actualToDate !== null && (
                          <p className={`text-xs ${v?.behind ? "text-red-600" : "text-emerald-600"}`}>
                            To date: {formatKpi(t.actualToDate, k.unit)} vs {formatKpi(t.plannedToDate, k.unit)} plan
                          </p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
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
