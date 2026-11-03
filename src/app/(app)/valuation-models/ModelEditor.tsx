"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";
import { KpiInputs, type InputMap } from "@/components/KpiInputs";
import { ValuationWalk } from "@/components/ValuationWalk";
import { check, compute } from "@/lib/formula";
import { money } from "@/lib/format";
import { EXAMPLE_MODEL, toCode, type KpiDraft } from "@/lib/model-templates";
import { saveModel } from "./actions";

type Props = { initial?: { id: string; name: string; description: string | null; formula: string; kpis: KpiDraft[] } };

const SELECT = "rounded-md border border-line bg-surface px-2 py-2 text-sm";

export function ModelEditor({ initial }: Props) {
  const [state, action, pending] = useActionState(saveModel, undefined);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [kpis, setKpis] = useState<(KpiDraft & { auto?: boolean })[]>(initial?.kpis ?? []);
  const [formula, setFormula] = useState(initial?.formula ?? "");
  const [test, setTest] = useState<InputMap>({});
  const ta = useRef<HTMLTextAreaElement>(null);

  const codes = kpis.map((k) => k.code);
  const validity = useMemo(() => (formula.trim() ? check(formula, codes) : null), [formula, codes.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const result = useMemo(() => (validity?.ok ? compute(formula, test) : null), [validity, formula, test]);

  const update = (i: number, patch: Partial<KpiDraft & { auto?: boolean }>) =>
    setKpis((ks) => ks.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  const insert = (code: string) => {
    const el = ta.current;
    if (!el) return setFormula((f) => f + code);
    const s = el.selectionStart, e = el.selectionEnd;
    setFormula(formula.slice(0, s) + code + formula.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + code.length, s + code.length); });
  };

  const loadExample = () => {
    setKpis(EXAMPLE_MODEL.kpis);
    setFormula(EXAMPLE_MODEL.formula);
    setTest({ MRR: 500000, EBITDA: 1800000, EBITDA_GROWTH: 0.2, ARR_GROWTH: 0.3, NRR: 1.05, NPS: 30, CUSTOMER_COUNT: 120, LARGEST_CUSTOMER_PCT: 0.08 });
    if (!name) setName("Conservative Model 2026");
  };

  const payload = JSON.stringify({ id: initial?.id, name, description, formula, kpis: kpis.map(({ code, name, kind, unit }) => ({ code, name, kind, unit })) });

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
            <p className="mt-0.5 text-sm text-ink-soft">Primary KPIs set the base value. Coefficient KPIs adjust it up or down.</p>
          </div>
          {!initial && kpis.length === 0 && (
            <Button type="button" variant="secondary" onClick={loadExample}>Start from the example model</Button>
          )}
        </div>
        {kpis.length > 0 && (
          <div className="mb-3 hidden grid-cols-[1.6fr_1.2fr_1fr_0.8fr_auto] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-ink-faint md:grid">
            <span>Name</span><span>Code (used in formula)</span><span>Type</span><span>Unit</span><span className="w-8" />
          </div>
        )}
        <div className="space-y-2">
          {kpis.map((k, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-md border border-line p-2 md:grid-cols-[1.6fr_1.2fr_1fr_0.8fr_auto] md:border-0 md:p-0">
              <Input
                className="col-span-2 md:col-span-1"
                value={k.name}
                placeholder="KPI name"
                onChange={(e) => update(i, { name: e.target.value, ...(k.auto ? { code: toCode(e.target.value) } : {}) })}
              />
              <Input className="col-span-2 font-mono text-xs uppercase md:col-span-1" value={k.code} placeholder="CODE" onChange={(e) => update(i, { code: toCode(e.target.value), auto: false })} />
              <select className={SELECT} value={k.kind} onChange={(e) => update(i, { kind: e.target.value as KpiDraft["kind"] })}>
                <option value="PRIMARY">Primary</option>
                <option value="COEFFICIENT">Coefficient</option>
              </select>
              <select className={SELECT} value={k.unit} onChange={(e) => update(i, { unit: e.target.value as KpiDraft["unit"] })}>
                <option value="CURRENCY">$ Currency</option>
                <option value="PERCENT">% Percent</option>
                <option value="NUMBER"># Number</option>
              </select>
              <button type="button" aria-label={`Remove ${k.name || "KPI"}`} onClick={() => setKpis(kpis.filter((_, j) => j !== i))} className="col-span-2 rounded-md px-2 text-sm text-ink-faint hover:bg-red-50 hover:text-red-600 md:col-span-1 md:w-8">✕</button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" className="mt-3" onClick={() => setKpis([...kpis, { code: "", name: "", kind: kpis.length === 0 ? "PRIMARY" : "COEFFICIENT", unit: "NUMBER", auto: true }])}>
          + Add KPI
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Formula</h2>
        <p className="mb-4 mt-0.5 text-sm text-ink-soft">
          Use KPI codes with <code>+ − * / ^</code>, comparisons, and <code>AVG</code>, <code>MIN</code>, <code>MAX</code>, <code>IF(condition, then, else)</code>, <code>AND</code>, <code>OR</code>. Write percentages as <code>15%</code>.
        </p>
        {kpis.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {kpis.filter((k) => k.code).map((k) => (
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
            <p className="mb-5 mt-0.5 text-sm text-ink-soft">Test values aren&apos;t saved. Create a valuation to keep them.</p>
            <KpiInputs kpis={kpis.filter((k) => k.code)} values={test} onChange={setTest} />
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
