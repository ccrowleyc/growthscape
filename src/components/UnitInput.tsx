"use client";

import { AmountInput } from "./AmountInput";

/**
 * Input for a KPI value in its unit. Currency shows € with comma separators; percent is
 * typed as a whole percentage (or percentage points) and stored as a decimal.
 */
export function UnitInput({
  value,
  unit,
  onChange,
  placeholder,
  size = "md",
  pctSuffix = "%",
  tone,
  align = "right",
  ariaLabel,
}: {
  value: number | null;
  unit: string;
  onChange: (v: number | null) => void;
  placeholder?: string;
  size?: "sm" | "md";
  pctSuffix?: string;
  tone?: string;
  align?: "right" | "center" | "left";
  ariaLabel?: string;
}) {
  const pad = size === "sm" ? "px-2 py-1 text-[13px]" : "px-3 py-2 text-sm";
  const alignCls = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const wrap = `flex items-center rounded-md border bg-surface focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 ${tone ?? "border-line"}`;
  if (unit === "CURRENCY") {
    return (
      <div className={wrap}>
        <span className={`pl-2 text-ink-faint ${size === "sm" ? "text-xs" : "text-sm"}`}>€</span>
        <AmountInput value={value} onChange={onChange} placeholder={placeholder} ariaLabel={ariaLabel} className={`${pad} ${alignCls}`} />
      </div>
    );
  }
  const pct = unit === "PERCENT";
  const shown = value === null || value === undefined ? "" : pct ? +(value * 100).toFixed(6) : value;
  return (
    <div className={wrap}>
      <input
        type="number"
        step="any"
        inputMode="decimal"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={shown}
        onChange={(e) => {
          const n = e.target.value === "" ? null : Number(e.target.value);
          onChange(n === null ? null : pct ? n / 100 : n);
        }}
        className={`w-full min-w-0 bg-transparent tabular-nums focus:outline-none ${pad} ${alignCls}`}
      />
      {pct && <span className={`pr-2 text-ink-faint ${size === "sm" ? "text-[11px]" : "text-sm"}`}>{pctSuffix}</span>}
    </div>
  );
}
