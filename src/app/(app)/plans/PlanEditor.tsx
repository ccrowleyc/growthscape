"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";
import { money } from "@/lib/format";
import { savePlan } from "./actions";

type Val = { id: string; name: string; kind: string; value: number | null; kpis: { code: string; name: string; unit: string }[] };
type Init = { id: string; name: string; owner: string | null };
type Other = { label: string; kpiCode: string; amount: number | null };
type Initial = { id: string; name: string; description: string | null; baselineValuationId: string; targetValuationId: string; marginPct: number; initiativeIds: string[]; other: Other[] };

const SELECT = "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm";

export function PlanEditor({ valuations, initiatives, initial }: { valuations: Val[]; initiatives: Init[]; initial?: Initial }) {
  const [state, action, pending] = useActionState(savePlan, undefined);
  const currents = valuations.filter((v) => v.kind === "CURRENT");
  const targets = valuations.filter((v) => v.kind === "TARGET");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [baseline, setBaseline] = useState(initial?.baselineValuationId ?? currents.at(-1)?.id ?? "");
  const [target, setTarget] = useState(initial?.targetValuationId ?? targets.at(-1)?.id ?? "");
  const [margin, setMargin] = useState(initial ? initial.marginPct * 100 : 5);
  const [ids, setIds] = useState<string[]>(initial?.initiativeIds ?? initiatives.map((i) => i.id));
  const [other, setOther] = useState<Other[]>(initial?.other ?? []);
  const kpis = valuations.find((v) => v.id === target)?.kpis ?? [];

  const payload = JSON.stringify({
    id: initial?.id, name, description, baselineValuationId: baseline, targetValuationId: target, marginPct: margin, initiativeIds: ids,
    other: other.map((o) => ({ ...o, amount: o.amount ?? 0 })),
  });
  const opt = (v: Val) => <option key={v.id} value={v.id}>{v.name} · {money(v.value)}</option>;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />
      <Card className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Plan name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2030 Strategic Plan" required /></Field>
          <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" /></Field>
          <Field label="Starting valuation" hint="The KPIs your initiatives build from.">
            <select value={baseline} onChange={(e) => setBaseline(e.target.value)} className={SELECT}>
              <option value="">Choose…</option>
              <optgroup label="Current">{currents.map(opt)}</optgroup>
              <optgroup label="Target">{targets.map(opt)}</optgroup>
            </select>
          </Field>
          <Field label="Target valuation" hint="What the plan needs to reach.">
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={SELECT}>
              <option value="">Choose…</option>
              <optgroup label="Target">{targets.map(opt)}</optgroup>
              <optgroup label="Current">{currents.map(opt)}</optgroup>
            </select>
          </Field>
          <Field label="Margin" hint="How close the plan must get to the target to count as on track.">
            <div className="flex w-32 rounded-md border border-line bg-surface">
              <input type="number" min={0} max={100} step="any" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none" />
              <span className="grid place-items-center pr-3 text-sm text-ink-faint">%</span>
            </div>
          </Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Strategic initiatives</h2>
        <p className="mb-4 mt-0.5 text-sm text-ink-soft">Their planned KPI changes are added to the starting KPIs.</p>
        {initiatives.length === 0 ? (
          <p className="text-sm text-ink-soft">No initiatives yet. <Link href="/initiatives/new" className="text-brand-700 underline">Create one</Link>.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {initiatives.map((i) => (
              <label key={i.id} className="flex items-start gap-3 rounded-md border border-line px-3 py-2.5 text-sm hover:bg-muted/50">
                <input type="checkbox" className="mt-0.5 accent-brand-600" checked={ids.includes(i.id)} onChange={(e) => setIds(e.target.checked ? [...ids, i.id] : ids.filter((x) => x !== i.id))} />
                <span><span className="font-medium">{i.name}</span>{i.owner && <span className="block text-xs text-ink-soft">{i.owner}</span>}</span>
              </label>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Other adjustments</h2>
        <p className="mb-4 mt-0.5 text-sm text-ink-soft">Changes not driven by an initiative, such as inflation increasing costs (a negative EBITDA adjustment).</p>
        <div className="space-y-2">
          {other.map((o, i) => {
            const unit = kpis.find((k) => k.code === o.kpiCode)?.unit;
            const pct = unit === "PERCENT";
            const upd = (p: Partial<Other>) => setOther(other.map((x, j) => (j === i ? { ...x, ...p } : x)));
            return (
              <div key={i} className="grid grid-cols-[1fr_1fr_140px_auto] gap-2">
                <Input value={o.label} onChange={(e) => upd({ label: e.target.value })} placeholder="e.g. Inflation on costs" />
                <select value={o.kpiCode} onChange={(e) => upd({ kpiCode: e.target.value })} className={SELECT}>
                  <option value="">KPI…</option>
                  {kpis.map((k) => <option key={k.code} value={k.code}>{k.name}</option>)}
                </select>
                <div className="flex rounded-md border border-line bg-surface">
                  <input type="number" step="any" value={o.amount === null ? "" : pct ? +(o.amount * 100).toFixed(6) : o.amount}
                    onChange={(e) => upd({ amount: e.target.value === "" ? null : pct ? Number(e.target.value) / 100 : Number(e.target.value) })}
                    className="w-full min-w-0 bg-transparent px-3 py-2 text-right text-sm focus:outline-none" />
                  {pct && <span className="grid place-items-center pr-2 text-xs text-ink-faint">pts</span>}
                </div>
                <button type="button" aria-label="Remove adjustment" onClick={() => setOther(other.filter((_, j) => j !== i))} className="w-8 rounded-md text-ink-faint hover:bg-red-50 hover:text-red-600">✕</button>
              </div>
            );
          })}
        </div>
        <Button type="button" variant="ghost" className="mt-3" onClick={() => setOther([...other, { label: "", kpiCode: "", amount: null }])}>+ Add adjustment</Button>
      </Card>

      <div className="flex items-center gap-3">
        <Button disabled={pending}>{pending ? "Saving…" : initial ? "Save plan" : "Create plan"}</Button>
        <ErrorText>{state?.error}</ErrorText>
      </div>
    </form>
  );
}
