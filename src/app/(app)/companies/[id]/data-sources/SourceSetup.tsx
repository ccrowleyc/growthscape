"use client";

import { useActionState, useState } from "react";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import { UnitInput } from "@/components/UnitInput";
import { PILLARS, SOURCES, parseCsv } from "@/lib/kpis";
import { formatKpi } from "@/lib/format";
import { saveSources } from "../../kpi-actions";

export type SourceRow = { id: string; pillar: string; code: string; name: string; unit: string; target: number | null; source: string; sourceDetail: string | null; currentValue: number | null; currentAsOf: string | null };

const SELECT = "w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm";

export function SourceSetup({ companyId, initial, canEdit }: { companyId: string; initial: SourceRow[]; canEdit: boolean }) {
  const [state, action, pending] = useActionState(saveSources, undefined);
  const [rows, setRows] = useState(initial);
  const [csv, setCsv] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const upd = (id: string, p: Partial<SourceRow>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const importCsv = (text: string) => {
    const parsed = parseCsv(text);
    const find = (key: string) => rows.find((r) => r.name.toLowerCase() === key.toLowerCase() || r.code === key.toUpperCase());
    let matched = 0;
    const next = rows.map((r) => ({ ...r }));
    for (const p of parsed) {
      const r = find(p.key);
      if (!r) continue;
      matched++;
      const n = next.find((x) => x.id === r.id)!;
      n.currentValue = p.value;
      if (n.source === "MANUAL") n.source = "CSV";
    }
    setRows(next);
    setMsg(`Matched ${matched} of ${parsed.length} rows by KPI name or code.`);
  };

  const ordered = PILLARS.flatMap((p) => rows.filter((r) => r.pillar === p));
  const payload = JSON.stringify(rows.map(({ id, source, sourceDetail, currentValue }) => ({ id, source, sourceDetail, currentValue })));

  if (rows.length === 0) return <Card className="p-8 text-center text-sm text-ink-soft">Choose the company&apos;s KPIs first.</Card>;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="payload" value={payload} />
      <input type="hidden" name="companyId" value={companyId} />
      <p className="text-sm text-ink-soft">
        Choose where each KPI&apos;s data comes from. Live connections to HubSpot, Salesforce, Xero, QuickBooks and Stripe are coming soon; until then, enter the current value or import a CSV.
        A snapshot of every KPI is taken automatically at each month end to build its history.
      </p>
      {canEdit && (
        <Card className="p-5">
          <h3 className="font-semibold">Import current values from CSV</h3>
          <p className="mb-3 mt-0.5 text-sm text-ink-soft">Paste rows of <code>KPI name or code, value</code>, or choose a file.</p>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={3} placeholder={"ARR annual growth rate,32%\nEBITDA,\"€1,800,000\""} className="w-full rounded-md border border-line bg-canvas px-3 py-2 font-mono text-xs" />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => importCsv(csv)} disabled={!csv.trim()}>Import pasted rows</Button>
            <label className="cursor-pointer text-sm font-medium text-brand-700 hover:underline">
              Choose CSV file<input type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) importCsv(await f.text()); }} />
            </label>
            {msg && <span className="text-sm text-ink-soft">{msg}</span>}
          </div>
        </Card>
      )}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b border-line bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
            <tr><th className="px-4 py-3">KPI</th><th className="w-44 px-4 py-3">Data source</th><th className="px-4 py-3">Source field</th><th className="w-44 px-4 py-3 text-right">Current value</th><th className="w-32 px-4 py-3 text-right">Target</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ordered.map((r) => {
              const src = SOURCES.find((s) => s.id === r.source);
              return (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3"><p className="font-medium">{r.name}</p><p className="text-xs text-ink-soft">{r.pillar}</p></td>
                  <td className="px-4 py-3">
                    <select className={SELECT} value={r.source} disabled={!canEdit} onChange={(e) => upd(r.id, { source: e.target.value })}>
                      {SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    {src && !src.live && <p className="mt-1 text-[11px] text-amber-700">Live sync coming soon</p>}
                  </td>
                  <td className="px-4 py-3">
                    {src?.hint ? <Input value={r.sourceDetail ?? ""} disabled={!canEdit} placeholder={src.hint} onChange={(e) => upd(r.id, { sourceDetail: e.target.value })} /> : <span className="text-xs text-ink-faint">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <UnitInput value={r.currentValue} unit={r.unit} size="sm" ariaLabel={`${r.name} current value`} onChange={(v) => upd(r.id, { currentValue: v })} />
                    {r.currentAsOf && <p className="mt-1 text-right text-[11px] text-ink-faint">Updated {r.currentAsOf}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-soft tabular-nums">{formatKpi(r.target, r.unit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {canEdit && (
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-canvas/95 py-4 backdrop-blur">
          <Button disabled={pending}>{pending ? "Saving…" : "Save data sources"}</Button>
          <ErrorText>{state?.error}</ErrorText>
          {state?.ok && <span className="text-sm text-emerald-700">{state.ok}</span>}
        </div>
      )}
    </form>
  );
}
