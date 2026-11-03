"use client";

import { UNIT_LABEL } from "@/lib/format";

export type KpiMeta = { code: string; name: string; kind: string; unit: string };
export type InputMap = Record<string, number | null>;

/** Grid of KPI inputs. Percent KPIs are entered as whole percentages and stored as decimals. */
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
              {list.map((k) => {
                const raw = values[k.code];
                const shown = raw === null || raw === undefined ? "" : k.unit === "PERCENT" ? +(raw * 100).toFixed(6) : raw;
                return (
                  <label key={k.code} className="block">
                    <span className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium">{k.name}</span>
                      <code className="text-[11px] text-ink-faint">{k.code}</code>
                    </span>
                    <div className="flex rounded-md border border-line bg-surface focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                      {k.unit === "CURRENCY" && <span className="grid place-items-center pl-3 text-sm text-ink-faint">$</span>}
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={shown}
                        onChange={(e) => {
                          const n = e.target.value === "" ? null : Number(e.target.value);
                          onChange({ ...values, [k.code]: n === null ? null : k.unit === "PERCENT" ? n / 100 : n });
                        }}
                        className="w-full rounded-md bg-transparent px-3 py-2 text-sm tabular-nums focus:outline-none"
                      />
                      {k.unit === "PERCENT" && <span className="grid place-items-center pr-3 text-sm text-ink-faint">{UNIT_LABEL.PERCENT}</span>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
