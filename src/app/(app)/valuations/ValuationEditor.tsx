"use client";

import { useActionState, useMemo, useState } from "react";
import { Button, Card, ErrorText, Field, Input } from "@/components/ui";
import { KpiInputs, type InputMap, type KpiMeta } from "@/components/KpiInputs";
import { ValuationWalk } from "@/components/ValuationWalk";
import { compute } from "@/lib/formula";
import { money } from "@/lib/format";
import { saveValuation } from "./actions";

type Model = { id: string; name: string; formula: string; kpis: KpiMeta[] };
type Initial = { id: string; name: string; kind: string; asOf: string; modelId: string; notes: string | null; inputs: InputMap };

export function ValuationEditor({ models, initial, defaultModelId, currentValues }: { models: Model[]; initial?: Initial; defaultModelId?: string; currentValues: InputMap }) {
  const [state, action, pending] = useActionState(saveValuation, undefined);
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState(initial?.kind ?? "CURRENT");
  const [asOf, setAsOf] = useState(initial?.asOf ?? new Date().toISOString().slice(0, 10));
  const [modelId, setModelId] = useState(initial?.modelId ?? defaultModelId ?? models[0]?.id ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  // New point-in-time valuations start from the company's current KPI values
  const [inputs, setInputs] = useState<InputMap>(initial?.inputs ?? currentValues);
  const model = models.find((m) => m.id === modelId);
  const result = useMemo(() => (model ? compute(model.formula, inputs) : null), [model, inputs]);

  const payload = JSON.stringify({ id: initial?.id, name, kind, asOf, modelId, notes, inputs });

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="payload" value={payload} />
      <div className="space-y-6">
        <Card className="p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Valuation name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dec 2025 Valuation – Conservative" required /></Field>
            <Field label="Valuation model">
              <select value={modelId} onChange={(e) => setModelId(e.target.value)} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm">
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <div className="grid grid-cols-2 rounded-md border border-line p-0.5 text-sm">
                {[["CURRENT", "Point-in-time"], ["TARGET", "Target"]].map(([v, l]) => (
                  <button type="button" key={v} onClick={() => setKind(v)} className={`rounded px-3 py-1.5 font-medium ${kind === v ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-muted"}`}>{l}</button>
                ))}
              </div>
            </Field>
            <Field label={kind === "TARGET" ? "Target date" : "As of"}><Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} required /></Field>
          </div>
        </Card>
        {model && (
          <Card className="p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">{kind === "TARGET" ? "Target KPIs" : "Input KPIs"}</h2>
              <Button type="button" variant="ghost" onClick={() => setInputs({ ...inputs, ...Object.fromEntries(model.kpis.map((k) => [k.code, currentValues[k.code] ?? null])) })}>
                Fill with current KPI values
              </Button>
            </div>
            <KpiInputs kpis={model.kpis} values={inputs} onChange={setInputs} />
          </Card>
        )}
        <Card className="p-6">
          <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-md border border-line px-3 py-2 text-sm" /></Field>
        </Card>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{kind === "TARGET" ? "Target valuation" : "Valuation"}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{result && "value" in result ? money(result.value) : "—"}</p>
          {result && "error" in result && <p className="mt-1 text-sm text-ink-soft">{result.error.replace("Missing value for", "Enter a value for")}</p>}
          {result && "steps" in result && <div className="mt-5 border-t border-line pt-2"><ValuationWalk steps={result.steps} /></div>}
          <div className="mt-6 space-y-3">
            <ErrorText>{state?.error}</ErrorText>
            <Button className="w-full" disabled={pending}>{pending ? "Saving…" : initial ? "Save valuation" : "Create valuation"}</Button>
          </div>
        </Card>
      </div>
    </form>
  );
}
