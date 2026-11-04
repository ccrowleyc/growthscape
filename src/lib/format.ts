export type Unit = "CURRENCY" | "PERCENT" | "NUMBER";

export const CURRENCY_SYMBOL = "€";
const LOCALE = "en-IE"; // € prefix with comma thousands separators: €1,234,567

const moneyFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const axisFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 });
const numFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

/** Full euro amount with comma separators, e.g. €156,770,000. */
export function money(v: number | null | undefined) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return moneyFmt.format(v);
}

/** Short euro amount for chart axes only, e.g. €150M. */
export function moneyAxis(v: number) {
  return axisFmt.format(v);
}

export function formatKpi(v: number | null | undefined, unit: string) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  if (unit === "CURRENCY") return money(v);
  if (unit === "PERCENT") return `${numFmt.format(+(v * 100).toFixed(2))}%`;
  return numFmt.format(v);
}

export function factor(v: number) {
  return `×${v.toLocaleString(LOCALE, { maximumFractionDigits: 4 })}`;
}

/** Number shown inside a currency input: 1234567.5 -> "1,234,567.5". */
export function groupDigits(v: number | null) {
  if (v === null || !Number.isFinite(v)) return "";
  return v.toLocaleString(LOCALE, { maximumFractionDigits: 2 });
}

/** Parse a typed amount, ignoring €, commas and spaces. Returns null for empty, NaN for invalid. */
export function parseAmount(s: string): number | null {
  const t = s.replace(/[€,\s]/g, "");
  if (t === "" || t === "-") return null;
  return Number(t);
}

export const UNIT_LABEL: Record<string, string> = { CURRENCY: CURRENCY_SYMBOL, PERCENT: "%", NUMBER: "#" };
