"use client";

import { useActionState, useState } from "react";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import { UnitInput } from "@/components/UnitInput";
import { KPI_LIBRARY, PILLARS, toCode } from "@/lib/kpis";
import { saveKpis } from "../../kpi-actions";

export type KpiRow = { id?: string; pillar: string; code: string; name: string; unit: string; direction: string; target: number | null; source?: string; auto?: boolean };

const SELECT = "rounded-md border border-line bg-surface px-2 py-1.5 text-sm";

export function KpiSetup({ companyId, initial, canEdit }: { companyId: string; initial: KpiRow[]; canEdit: boolean }) {
  const [state, action, pending] = useActionState(saveKpis, undefined);
  const [kpis, setKpis] = useState<KpiRow[]>(initial);
  const upd = (i: number, p: Partial<KpiRow>) => setKpis(kpis.map((k, j) => (j === i ? { ...k, ...p } : k)));
  const usedCodes = new Set(kpis.map((k) => k.code));
  const payload = JSON.stringify(kpis.map(({ id, pillar, code, name, unit, direction, target, source }) => ({ id, pillar, code, name, unit, direction, target, source })));

  return (
    <form action={action}>
      <input type="hidden" name="payload" value={payload} />
      <input type="hidden" name="companyId" value={companyId} />
      <p className="mb-4 text-sm text-ink-soft">
        Pick the KPIs that best fit this company in each pillar, and set a target for each. Click a suggestion to add it, or add your own. These are the KPIs your valuation models and initiatives can use.
      </p>
      <div className="space-y-4">
        {PILLARS.map((p) => {
          const rows = kpis.map((k, i) => ({ k, i })).filter((x) => x.k.pillar === p);
          return (
            <Card key={p} className="p-5">
              <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{p}</h3><span className="text-xs text-ink-soft">{rows.length} KPI{rows.length === 1 ? "" : "s"}</span></div>
              {rows.length > 0 && (
                <div className="mb-3 space-y-2">
                  <div className="hidden grid-cols-[2fr_1.3fr_0.8fr_0.9fr_1.2fr_auto] gap-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint md:grid">
                    <span>KPI</span><span>Code</span><span>Unit</span><span>Better when</span><span className="text-right">Target</span><span className="w-7" />
                  </div>
                  {rows.map(({ k, i }) => (
                    <div key={i} className="grid grid-cols-2 gap-2 md:grid-cols-[2fr_1.3fr_0.8fr_0.9fr_1.2fr_auto]">
                      <Input className="col-span-2 md:col-span-1" value={k.name} placeholder="KPI name" disabled={!canEdit}
                        onChange={(e) => upd(i, { name: e.target.value, ...(k.auto ? { code: toCode(e.target.value) } : {}) })} />
                      <Input className="font-mono text-xs" value={k.code} disabled={!!k.id || !canEdit} title={k.id ? "Codes can't change once saved" : undefined}
                        onChange={(e) => upd(i, { code: toCode(e.target.value), auto: false })} />
                      <select className={SELECT} value={k.unit} disabled={!canEdit} onChange={(e) => upd(i, { unit: e.target.value })}>
                        <option value="CURRENCY">€</option><option value="PERCENT">%</option><option value="NUMBER">#</option>
                      </select>
                      <select className={SELECT} value={k.direction} disabled={!canEdit} onChange={(e) => upd(i, { direction: e.target.value })}>
                        <option value="HIGHER">Higher</option><option value="LOWER">Lower</option>
                      </select>
                      <UnitInput value={k.target} unit={k.unit} size="sm" placeholder="Target" ariaLabel={`${k.name} target`} onChange={(v) => upd(i, { target: v })} />
                      {canEdit && <button type="button" aria-label={`Remove ${k.name}`} onClick={() => setKpis(kpis.filter((_, j) => j !== i))} className="w-7 rounded text-ink-faint hover:bg-red-50 hover:text-red-600">✕</button>}
                    </div>
                  ))}
                </div>
              )}
              {canEdit && (
                <div className="flex flex-wrap gap-1.5">
                  {KPI_LIBRARY[p].filter((s) => !usedCodes.has(s.code)).map((s) => (
                    <button type="button" key={s.code} onClick={() => setKpis([...kpis, { pillar: p, code: s.code, name: s.name, unit: s.unit, direction: s.direction, target: null, source: s.source }])}
                      className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-ink-soft hover:border-brand-500 hover:text-brand-700">+ {s.name}</button>
                  ))}
                  <button type="button" onClick={() => setKpis([...kpis, { pillar: p, code: "", name: "", unit: "NUMBER", direction: "HIGHER", target: null, auto: true }])}
                    className="rounded-full px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">+ Custom KPI</button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {canEdit && (
        <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t border-line bg-canvas/95 py-4 backdrop-blur">
          <Button disabled={pending}>{pending ? "Saving…" : "Save KPIs"}</Button>
          <Button variant="secondary" disabled={pending} name="next" value="sources">Save and connect data sources</Button>
          <ErrorText>{state?.error}</ErrorText>
          {state?.ok && <span className="text-sm text-emerald-700">{state.ok}</span>}
        </div>
      )}
    </form>
  );
}
