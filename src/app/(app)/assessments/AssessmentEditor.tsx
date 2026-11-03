"use client";

import { useActionState, useMemo, useState } from "react";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import { RAG_CLASS, ScoreBar } from "@/components/Rag";
import { KPI_LIBRARY, PILLARS, SOURCES, analyse, attainment, parseCsv, rag, trend, type AKpi } from "@/lib/assessment";
import { formatKpi } from "@/lib/format";
import { saveAssessment } from "./actions";

const SELECT = "rounded-md border border-line bg-surface px-2 py-1.5 text-sm";
const STEPS = ["Choose KPIs", "Connect data", "Analysis"];

function Num({ value, unit, onChange, placeholder }: { value: number | null; unit: string; onChange: (v: number | null) => void; placeholder?: string }) {
  const pct = unit === "PERCENT";
  return (
    <div className="flex rounded-md border border-line bg-surface focus-within:border-brand-500">
      {unit === "CURRENCY" && <span className="grid place-items-center pl-2 text-xs text-ink-faint">$</span>}
      <input type="number" step="any" placeholder={placeholder} value={value === null ? "" : pct ? +(value * 100).toFixed(6) : value}
        onChange={(e) => onChange(e.target.value === "" ? null : pct ? Number(e.target.value) / 100 : Number(e.target.value))}
        className="w-full min-w-0 bg-transparent px-2 py-1.5 text-right text-sm tabular-nums focus:outline-none" />
      {pct && <span className="grid place-items-center pr-2 text-xs text-ink-faint">%</span>}
    </div>
  );
}

export function AssessmentEditor({ id, name: initialName, initialStep, initialKpis }: { id: string; name: string; initialStep: number; initialKpis: AKpi[] }) {
  const [state, action, pending] = useActionState(saveAssessment, undefined);
  const [step, setStep] = useState(initialStep);
  const [name, setName] = useState(initialName);
  const [kpis, setKpis] = useState<AKpi[]>(initialKpis);
  const [csv, setCsv] = useState("");
  const [csvMsg, setCsvMsg] = useState<string | null>(null);
  const result = useMemo(() => analyse(kpis), [kpis]);

  const upd = (i: number, p: Partial<AKpi>) => setKpis(kpis.map((k, j) => (j === i ? { ...k, ...p } : k)));
  const add = (pillar: string, s?: { name: string; unit: string; direction: string }) =>
    setKpis([...kpis, { pillar, name: s?.name ?? "", unit: s?.unit ?? "NUMBER", direction: s?.direction ?? "HIGHER", target: null, actual: null, prior: null, source: "MANUAL", sourceDetail: null }]);

  const importCsv = (text: string) => {
    const rows = parseCsv(text);
    let matched = 0;
    const byName = new Map(rows.map((r) => [r.name.toLowerCase(), r]));
    setKpis(kpis.map((k) => {
      const r = byName.get(k.name.toLowerCase());
      if (!r) return k;
      matched++;
      return { ...k, actual: r.actual, prior: r.prior ?? k.prior, source: "CSV" };
    }));
    setCsvMsg(`Matched ${matched} of ${rows.length} rows to KPIs by name.`);
  };

  const payload = JSON.stringify({ id, name, kpis });

  return (
    <form action={action}>
      <input type="hidden" name="payload" value={payload} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm text-base font-medium" aria-label="Assessment name" />
        <ol className="flex rounded-lg border border-line bg-surface p-1 text-sm">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button type="button" onClick={() => setStep(i + 1)} className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium ${step === i + 1 ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-muted"}`}>
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${step === i + 1 ? "bg-white/20" : "bg-muted"}`}>{i + 1}</span>{s}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">Pick the KPIs that matter for each pillar and set a target for each. Click a suggestion to add it, or add your own.</p>
          {PILLARS.map((p) => {
            const rows = kpis.map((k, i) => ({ k, i })).filter((x) => x.k.pillar === p);
            const used = new Set(rows.map((r) => r.k.name));
            return (
              <Card key={p} className="p-5">
                <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{p}</h3><span className="text-xs text-ink-soft">{rows.length} KPI{rows.length === 1 ? "" : "s"}</span></div>
                {rows.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 text-[11px] font-medium uppercase tracking-wide text-ink-faint md:grid"><span>KPI</span><span>Unit</span><span>Better when</span><span className="text-right">Target</span><span className="w-7" /></div>
                    {rows.map(({ k, i }) => (
                      <div key={i} className="grid grid-cols-2 gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                        <Input className="col-span-2 md:col-span-1" value={k.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="KPI name" />
                        <select className={SELECT} value={k.unit} onChange={(e) => upd(i, { unit: e.target.value })}><option value="PERCENT">%</option><option value="CURRENCY">$</option><option value="NUMBER">#</option></select>
                        <select className={SELECT} value={k.direction} onChange={(e) => upd(i, { direction: e.target.value })}><option value="HIGHER">Higher</option><option value="LOWER">Lower</option></select>
                        <Num value={k.target} unit={k.unit} onChange={(v) => upd(i, { target: v })} placeholder="Target" />
                        <button type="button" aria-label="Remove KPI" onClick={() => setKpis(kpis.filter((_, j) => j !== i))} className="w-7 rounded text-ink-faint hover:bg-red-50 hover:text-red-600">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {KPI_LIBRARY[p].filter((s) => !used.has(s.name)).map((s) => (
                    <button type="button" key={s.name} onClick={() => add(p, s)} className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-ink-soft hover:border-brand-500 hover:text-brand-700">+ {s.name}</button>
                  ))}
                  <button type="button" onClick={() => add(p)} className="rounded-full px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">+ Custom KPI</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold">Import from CSV</h3>
            <p className="mb-3 mt-0.5 text-sm text-ink-soft">Paste rows of <code>KPI name, current value, prior value</code>, or choose a file. Rows are matched to KPIs by name.</p>
            <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={3} placeholder={"ARR growth rate,32%,25%\nNet promoter score,41,36"} className="w-full rounded-md border border-line bg-canvas px-3 py-2 font-mono text-xs" />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" onClick={() => importCsv(csv)} disabled={!csv.trim()}>Import pasted rows</Button>
              <label className="cursor-pointer text-sm font-medium text-brand-700 hover:underline">
                Choose CSV file<input type="file" accept=".csv,text/csv" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) importCsv(await f.text()); }} />
              </label>
              {csvMsg && <span className="text-sm text-ink-soft">{csvMsg}</span>}
            </div>
          </Card>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                <tr><th className="px-4 py-3">KPI</th><th className="px-4 py-3">Data source</th><th className="px-4 py-3 text-right">Prior</th><th className="px-4 py-3 text-right">Current</th><th className="px-4 py-3 text-right">Target</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {kpis.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-soft">Add KPIs in step 1 first.</td></tr>}
                {PILLARS.flatMap((p) => kpis.map((k, i) => ({ k, i })).filter((x) => x.k.pillar === p)).map(({ k, i }) => {
                  const src = SOURCES.find((s) => s.id === k.source);
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2.5"><p className="font-medium">{k.name || "Untitled"}</p><p className="text-xs text-ink-soft">{k.pillar}</p></td>
                      <td className="px-4 py-2.5">
                        <select className={SELECT} value={k.source} onChange={(e) => upd(i, { source: e.target.value })}>
                          {SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}{s.live ? "" : " (coming soon)"}</option>)}
                        </select>
                        {src && !src.live && <p className="mt-1 text-[11px] text-amber-700">Live sync isn&apos;t available yet. Enter the value manually for now.</p>}
                      </td>
                      <td className="w-36 px-4 py-2.5"><Num value={k.prior} unit={k.unit} onChange={(v) => upd(i, { prior: v })} /></td>
                      <td className="w-36 px-4 py-2.5"><Num value={k.actual} unit={k.unit} onChange={(v) => upd(i, { actual: v })} /></td>
                      <td className="w-28 px-4 py-2.5 text-right text-ink-soft tabular-nums">{formatKpi(k.target, k.unit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[280px_1fr]">
            <Card className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Overall score</p>
              <p className={`mt-1 text-4xl font-semibold tabular-nums tracking-tight ${RAG_CLASS[result.overallRag].text}`}>{result.overall === null ? "—" : `${Math.round(result.overall * 100)}%`}</p>
              <p className="text-sm text-ink-soft">of target, averaged across pillars</p>
              {result.missing > 0 && <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">{result.missing} KPI{result.missing === 1 ? " has" : "s have"} no current value yet.</p>}
            </Card>
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">By pillar</h3>
              <div className="space-y-3">
                {result.pillars.map((p) => (
                  <div key={p.pillar} className="grid grid-cols-[180px_1fr_56px] items-center gap-4 text-sm">
                    <span className="truncate">{p.pillar}</span>
                    <ScoreBar score={p.score} rag={p.rag} />
                    <span className={`text-right font-medium tabular-nums ${RAG_CLASS[p.rag].text}`}>{p.score === null ? "—" : `${Math.round(p.score * 100)}%`}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink-soft">The tick marks the target. Scores are current value ÷ target (inverted where lower is better), capped at 150%.</p>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[["Needs attention", result.weakest], ["Strongest", result.strongest]].map(([title, list]) => (
              <Card key={title as string} className="p-6">
                <h3 className="mb-3 font-semibold">{title as string}</h3>
                {(list as typeof result.weakest).length === 0 ? <p className="text-sm text-ink-soft">Add targets and current values to see this.</p> : (
                  <ul className="divide-y divide-line text-sm">
                    {(list as typeof result.weakest).map(({ k, a }) => (
                      <li key={k.pillar + k.name} className="flex items-center justify-between gap-3 py-2.5">
                        <span><span className="font-medium">{k.name}</span><span className="block text-xs text-ink-soft">{k.pillar}</span></span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RAG_CLASS[rag(a)].chip}`}>{Math.round(a! * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-line bg-muted/50 text-right text-xs font-medium uppercase tracking-wide text-ink-soft">
                <tr><th className="px-5 py-3 text-left">KPI</th><th className="px-4 py-3">Prior</th><th className="px-4 py-3">Current</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Trend</th><th className="px-5 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-line text-right tabular-nums">
                {PILLARS.flatMap((p) => kpis.filter((k) => k.pillar === p)).map((k, i) => {
                  const a = attainment(k), r = rag(a), t = trend(k);
                  return (
                    <tr key={i}>
                      <td className="px-5 py-2.5 text-left"><p className="font-medium">{k.name}</p><p className="text-xs text-ink-soft">{k.pillar}</p></td>
                      <td className="px-4 py-2.5 text-ink-soft">{formatKpi(k.prior, k.unit)}</td>
                      <td className="px-4 py-2.5 font-medium">{formatKpi(k.actual, k.unit)}</td>
                      <td className="px-4 py-2.5 text-ink-soft">{formatKpi(k.target, k.unit)}</td>
                      <td className={`px-4 py-2.5 ${t === "up" ? "text-emerald-600" : t === "down" ? "text-red-600" : "text-ink-faint"}`}>{t === "up" ? "▲ Improving" : t === "down" ? "▼ Declining" : t === "flat" ? "Flat" : "—"}</td>
                      <td className="px-5 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RAG_CLASS[r].chip}`}>{RAG_CLASS[r].label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <div className="sticky bottom-0 mt-6 flex items-center gap-3 border-t border-line bg-canvas/95 py-4 backdrop-blur">
        <Button disabled={pending} name="step" value={step}>{pending ? "Saving…" : "Save"}</Button>
        {step < 3 && <Button variant="secondary" disabled={pending} name="step" value={step + 1}>Save and continue to {STEPS[step]}</Button>}
        <ErrorText>{state?.error}</ErrorText>
      </div>
    </form>
  );
}
