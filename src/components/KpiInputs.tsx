"use client";

import { UnitInput } from "./UnitInput";

export type KpiMeta = { code: string; name: string; kind: string; unit: string };
export type InputMap = Record<string, number | null>;

/** Grid of KPI inputs, grouped into primary and coefficient KPIs. */
export function KpiInputs({ kpis, values, onChange }: { kpis: KpiMeta[]; values: InputMap; onChange: (v: InputMap) => void }) {
  const groups = [
    { kind: "PRIMARY", title: "Primary KPIs" },
    { kind: "COEFFICIENT", title: "Coefficient KPIs" },
  ];
  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const list = kpis.filter((k) => k.kind === g.kind);
        if (!list.length) return null;
        return (
          <div key={g.kind}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{g.title}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((k) => (
                <label key={k.code} className="block">
                  <span className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{k.name}</span>
                    <code className="text-[11px] text-ink-faint">{k.code}</code>
                  </span>
                  <UnitInput value={values[k.code] ?? null} unit={k.unit} ariaLabel={k.name} onChange={(n) => onChange({ ...values, [k.code]: n })} />
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
