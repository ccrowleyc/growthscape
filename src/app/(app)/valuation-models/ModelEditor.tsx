"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";
import { KpiInputs, type InputMap } from "@/components/KpiInputs";
import { ValuationWalk } from "@/components/ValuationWalk";
import { check, compute } from "@/lib/formula";
import { money } from "@/lib/format";
import { EXAMPLE_MODEL, type ModelKpiDraft } from "@/lib/model-templates";
import type { CatalogKpi } from "@/lib/kpi-catalog";
import { saveModel } from "./actions";

type Props = { companyKpis: CatalogKpi[]; companyId: string; initial?: { id: string; name: string; description: string | null; formula: string; kpis: ModelKpiDraft[] } };

const SELECT = "rounded-md border border-line bg-surface px-2 py-2 text-sm";

export function ModelEditor({ initial, companyKpis, companyId }: Props) {
  const [state, action, pending] = useActionState(saveModel, undefined);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [chosen, setChosen] = useState<ModelKpiDraft[]>(initial?.kpis ?? []);
  const byCode = useMemo(() => new Map(companyKpis.map((k) => [k.code, k])), [companyKpis]);
  const kpis = chosen.filter((c) => byCode.has(c.code)).map((c) => ({ ...c, name: byCode.get(c.code)!.name, unit: byCode.get(c.code)!.unit }));
  const available = companyKpis.filter((k) => !chosen.some((c) => c.code === k.code));
  const missingForExample = EXAMPLE_MODEL.kpis.filter((k) => !byCode.has(k.code)).map((k) => k.code);
  const [formula, setFormula] = useState(initial?.formula ?? "");
  const [test, setTest] = useState<InputMap>(() => Object.fromEntries(companyKpis.map((k) => [k.code, k.currentValue])));
  const ta = useRef<HTMLTextAreaElement>(null);

  const codes = kpis.map((k) => k.code);
  const validity = useMemo(() => (formula.trim() ? check(formula, codes) : null), [formula, codes.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const result = useMemo(() => (validity?.ok ? compute(formula, test) : null), [validity, formula, test]);

  const update = (code: string, patch: Partial<ModelKpiDraft>) => setChosen((ks) => ks.map((k) => (k.code === code ? { ...k, ...patch } : k)));

  const insert = (code: string) => {
    const el = ta.current;
    if (!el) return setFormula((f) => f + code);
    const s = el.selectionStart, e = el.selectionEnd;
    setFormula(formula.slice(0, s) + code + formula.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + code.length, s + code.length); });
  };

  const loadExample = () => {
    setChosen(EXAMPLE_MODEL.kpis);
    setFormula(EXAMPLE_MODEL.formula);
    if (!name) setName("Conservative Model 2026");
  };

  const payload = JSON.stringify({ id: initial?.id, name, description, formula, kpis: kpis.map(({ code, kind }) => ({ code, kind })) });
  const prefillTest = () => setTest(Object.fromEntries(kpis.map((k) => [k.code, byCode.get(k.code)?.currentValue ?? null])));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />

      <Card className="p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Model name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Conservative Model 2026" required /></Field>
          <Field label="Description"><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" /></Field>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">KPIs</h2>
            <p className="mt-0.5 text-sm text-ink-soft">Choose from the company&apos;s KPIs. Primary KPIs set the base value; coefficient KPIs adjust it up or down.</p>
          </div>
          {!initial && kpis.length === 0 && (
            missingForExample.length === 0
              ? <Button type="button" variant="secondary" onClick={loadExample}>Start from the example model</Button>
              : <p className="max-w-xs text-right text-xs text-ink-soft">The example model needs these KPIs set up for the company: {missingForExample.join(", ")}.</p>
          )}
        </div>
        {companyKpis.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">
            This company has no KPIs yet. <a href={`/companies/${companyId}/kpis`} className="font-medium text-brand-700 underline">Set up its KPIs</a> first.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {kpis.map((k) => (
                <div key={k.code} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-line px-3 py-2">
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{k.name}</p><code className="text-[11px] text-ink-faint">{k.code}</code></div>
                  <select className={SELECT} value={k.kind} onChange={(e) => update(k.code, { kind: e.target.value as ModelKpiDraft["kind"] })}>
                    <option value="PRIMARY">Primary</option>
                    <option value="COEFFICIENT">Coefficient</option>
                  </select>
                  <button type="button" aria-label={`Remove ${k.name}`} onClick={() => setChosen(chosen.filter((c) => c.code !== k.code))} className="w-8 rounded-md py-1.5 text-sm text-ink-faint hover:bg-red-50 hover:text-red-600">✕</button>
                </div>
              ))}
            </div>
            {available.length > 0 && (
              <select
                className={`${SELECT} mt-3`}
                value=""
                onChange={(e) => e.target.value && setChosen([...chosen, { code: e.target.value, kind: chosen.length === 0 ? "PRIMARY" : "COEFFICIENT" }])}
              >
                <option value="">+ Add a KPI…</option>
                {available.map((k) => <option key={k.code} value={k.code}>{k.name} ({k.pillar})</option>)}
              </select>
            )}
          </>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Formula</h2>
        <p className="mb-4 mt-0.5 text-sm text-ink-soft">
          Use KPI codes with <code>+ − * / ^</code>, comparisons, and <code>AVG</code>, <code>MIN</code>, <code>MAX</code>, <code>IF(condition, then, else)</code>, <code>AND</code>, <code>OR</code>. Write percentages as <code>15%</code>.
        </p>
        {kpis.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {kpis.map((k) => (
              <button type="button" key={k.code} onClick={() => insert(k.code)} className="rounded bg-muted px-2 py-1 font-mono text-[11px] text-ink-soft hover:bg-brand-50 hover:text-brand-700">{k.code}</button>
            ))}
          </div>
        )}
        <textarea
          ref={ta}
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          rows={7}
          spellCheck={false}
          className="w-full rounded-md border border-line bg-canvas px-3 py-2.5 font-mono text-[13px] leading-relaxed focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          placeholder="AVG(MRR * 12 * 30, EBITDA * 15) * (1 + EBITDA_GROWTH)"
        />
        <div className="mt-2 min-h-5 text-sm">
          {validity?.ok && <span className="text-emerald-600">✓ Formula is valid</span>}
          {validity && !validity.ok && <span className="text-red-600">{validity.error}</span>}
        </div>
      </Card>

      {validity?.ok && kpis.length > 0 && (
        <Card className="grid gap-8 p-6 lg:grid-cols-2">
          <div>
            <h2 className="text-base font-semibold">Try it</h2>
            <p className="mb-3 mt-0.5 text-sm text-ink-soft">Test values aren&apos;t saved. Create a valuation to keep them.</p>
            <Button type="button" variant="ghost" className="mb-4 -ml-3" onClick={prefillTest}>Fill with current KPI values</Button>
            <KpiInputs kpis={kpis} values={test} onChange={setTest} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Test valuation</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{result && "value" in result ? money(result.value) : "—"}</p>
            {result && "error" in result && <p className="mt-1 text-sm text-ink-soft">{result.error}</p>}
            {result && "steps" in result && <div className="mt-5"><ValuationWalk steps={result.steps} /></div>}
          </div>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Button disabled={pending}>{pending ? "Saving…" : initial ? "Save model" : "Create model"}</Button>
        <ErrorText>{state?.error}</ErrorText>
      </div>
    </form>
  );
}
