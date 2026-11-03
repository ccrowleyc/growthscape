export type Unit = "CURRENCY" | "PERCENT" | "NUMBER";

const CURRENCY = "USD";

export function money(v: number | null | undefined, compact = true) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    notation: compact && Math.abs(v) >= 1e6 ? "compact" : "standard",
    maximumFractionDigits: compact && Math.abs(v) >= 1e6 ? 2 : 0,
  }).format(v);
}

export function formatKpi(v: number | null | undefined, unit: string) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  if (unit === "CURRENCY") return money(v);
  if (unit === "PERCENT") return `${+(v * 100).toFixed(2)}%`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(v);
}

export function factor(v: number) {
  return `×${v.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
}

export const UNIT_LABEL: Record<string, string> = { CURRENCY: "$", PERCENT: "%", NUMBER: "#" };
