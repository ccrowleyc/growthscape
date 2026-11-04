export const PILLARS = [
  "Market & Positioning",
  "Product & Innovation",
  "Revenue Growth",
  "Operations & Scalability",
  "Customer Success & Retention",
  "Financial Health",
  "Leadership & Talent",
  "Governance & Risk",
] as const;
export type Pillar = (typeof PILLARS)[number];

export type Unit = "CURRENCY" | "PERCENT" | "NUMBER";
export type Direction = "HIGHER" | "LOWER";
export type LibraryKpi = { code: string; name: string; unit: Unit; direction: Direction; source: string };

const k = (code: string, name: string, unit: Unit, direction: Direction, source: string): LibraryKpi => ({ code, name, unit, direction, source });

/** Suggested KPIs per pillar, with the data source each usually comes from. */
export const KPI_LIBRARY: Record<Pillar, LibraryKpi[]> = {
  "Market & Positioning": [
    k("MARKET_SHARE", "Market share", "PERCENT", "HIGHER", "MANUAL"),
    k("WIN_RATE", "Win rate", "PERCENT", "HIGHER", "SALESFORCE"),
    k("INBOUND_PIPELINE_PCT", "Pipeline from inbound", "PERCENT", "HIGHER", "HUBSPOT"),
    k("BRAND_AWARENESS", "Brand awareness", "PERCENT", "HIGHER", "MANUAL"),
  ],
  "Product & Innovation": [
    k("NEW_PRODUCT_REVENUE_PCT", "Revenue from products < 3 years old", "PERCENT", "HIGHER", "MANUAL"),
    k("RND_PCT_REVENUE", "R&D spend % of revenue", "PERCENT", "HIGHER", "XERO"),
    k("FEATURE_ADOPTION", "Feature adoption rate", "PERCENT", "HIGHER", "MANUAL"),
    k("RELEASES_PER_QUARTER", "Releases per quarter", "NUMBER", "HIGHER", "MANUAL"),
  ],
  "Revenue Growth": [
    k("MRR", "Monthly recurring revenue", "CURRENCY", "HIGHER", "STRIPE"),
    k("ARR", "Annual recurring revenue", "CURRENCY", "HIGHER", "STRIPE"),
    k("ARR_GROWTH", "ARR annual growth rate", "PERCENT", "HIGHER", "STRIPE"),
    k("PIPELINE_COVERAGE", "Pipeline coverage", "NUMBER", "HIGHER", "SALESFORCE"),
    k("ACV", "Average contract value", "CURRENCY", "HIGHER", "SALESFORCE"),
    k("SALES_CYCLE_DAYS", "Sales cycle (days)", "NUMBER", "LOWER", "SALESFORCE"),
  ],
  "Operations & Scalability": [
    k("REVENUE_PER_EMPLOYEE", "Revenue per employee", "CURRENCY", "HIGHER", "MANUAL"),
    k("GROSS_MARGIN", "Gross margin", "PERCENT", "HIGHER", "XERO"),
    k("IMPLEMENTATION_DAYS", "Implementation time (days)", "NUMBER", "LOWER", "MANUAL"),
    k("TICKETS_PER_CUSTOMER", "Support tickets per customer", "NUMBER", "LOWER", "HUBSPOT"),
  ],
  "Customer Success & Retention": [
    k("NRR", "Net revenue retention", "PERCENT", "HIGHER", "STRIPE"),
    k("GRR", "Gross revenue retention", "PERCENT", "HIGHER", "STRIPE"),
    k("LOGO_CHURN", "Logo churn", "PERCENT", "LOWER", "HUBSPOT"),
    k("NPS", "Net promoter score", "NUMBER", "HIGHER", "HUBSPOT"),
    k("CUSTOMER_COUNT", "Customer count", "NUMBER", "HIGHER", "HUBSPOT"),
  ],
  "Financial Health": [
    k("EBITDA", "EBITDA", "CURRENCY", "HIGHER", "XERO"),
    k("EBITDA_GROWTH", "EBITDA annual growth rate", "PERCENT", "HIGHER", "XERO"),
    k("EBITDA_MARGIN", "EBITDA margin", "PERCENT", "HIGHER", "XERO"),
    k("RULE_OF_40", "Rule of 40", "NUMBER", "HIGHER", "MANUAL"),
    k("CASH_RUNWAY_MONTHS", "Cash runway (months)", "NUMBER", "HIGHER", "XERO"),
    k("CAC_PAYBACK_MONTHS", "CAC payback (months)", "NUMBER", "LOWER", "MANUAL"),
  ],
  "Leadership & Talent": [
    k("EMPLOYEE_ENGAGEMENT", "Employee engagement", "PERCENT", "HIGHER", "MANUAL"),
    k("REGRETTED_ATTRITION", "Regretted attrition", "PERCENT", "LOWER", "MANUAL"),
    k("SUCCESSION_COVERAGE", "Key roles with successors", "PERCENT", "HIGHER", "MANUAL"),
    k("TIME_TO_HIRE_DAYS", "Time to hire (days)", "NUMBER", "LOWER", "MANUAL"),
  ],
  "Governance & Risk": [
    k("LARGEST_CUSTOMER_PCT", "Largest customer % of revenue", "PERCENT", "LOWER", "STRIPE"),
    k("OPEN_AUDIT_FINDINGS", "Open audit findings", "NUMBER", "LOWER", "MANUAL"),
    k("SECURITY_INCIDENTS", "Security incidents", "NUMBER", "LOWER", "MANUAL"),
    k("BOARD_MEETINGS", "Board meetings held", "NUMBER", "HIGHER", "MANUAL"),
  ],
};

export const SOURCES = [
  { id: "MANUAL", label: "Manual entry", live: true, hint: "" },
  { id: "CSV", label: "CSV import", live: true, hint: "" },
  { id: "HUBSPOT", label: "HubSpot", live: false, hint: "Property or report name" },
  { id: "SALESFORCE", label: "Salesforce", live: false, hint: "Report or field name" },
  { id: "XERO", label: "Xero", live: false, hint: "Account or report line" },
  { id: "QUICKBOOKS", label: "QuickBooks", live: false, hint: "Account or report line" },
  { id: "STRIPE", label: "Stripe", live: false, hint: "Metric, e.g. MRR" },
] as const;

export function sourceLabel(id: string) {
  return SOURCES.find((s) => s.id === id)?.label ?? id;
}

export type KpiLike = { pillar: string; code: string; name: string; unit: string; direction: string; target: number | null; currentValue: number | null };
export type Rag = "green" | "amber" | "red" | "none";

/** Attainment vs target: 1 = on target. Lower-is-better KPIs are inverted. Capped at 150%. */
export function attainment(k: { target: number | null; currentValue: number | null; direction: string }): number | null {
  const { target, currentValue: actual } = k;
  if (actual === null || target === null) return null;
  if (k.direction === "LOWER") return actual <= 0 ? 1.5 : Math.min(1.5, target / actual);
  if (target === 0) return actual >= 0 ? 1 : 0;
  return Math.max(0, Math.min(1.5, actual / target));
}

export function rag(a: number | null): Rag {
  if (a === null) return "none";
  return a >= 1 ? "green" : a >= 0.8 ? "amber" : "red";
}

/** Whether a change from `from` to `to` is an improvement for this KPI. */
export function better(direction: string, from: number, to: number): "up" | "down" | "flat" {
  const d = to - from;
  if (Math.abs(d) < 1e-12) return "flat";
  return (direction === "LOWER" ? d < 0 : d > 0) ? "up" : "down";
}

export function analyse<T extends KpiLike>(kpis: T[]) {
  const pillars = PILLARS.map((p) => {
    const list = kpis.filter((k) => k.pillar === p);
    const scores = list.map(attainment).filter((x): x is number => x !== null);
    const score = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return { pillar: p, count: list.length, scored: scores.length, score, rag: rag(score) };
  });
  const scored = pillars.filter((p) => p.score !== null);
  const overall = scored.length ? scored.reduce((a, p) => a + p.score!, 0) / scored.length : null;
  const ranked = kpis.map((k) => ({ k, a: attainment(k) })).filter((x) => x.a !== null).sort((a, b) => a.a! - b.a!);
  return { pillars, overall, overallRag: rag(overall), weakest: ranked.slice(0, 3), strongest: ranked.slice(-3).reverse(), missing: kpis.filter((k) => k.currentValue === null).length };
}

/** Parse "KPI name or code, value" rows. Values may use %, € and thousands separators. */
export function parseCsv(text: string): { key: string; value: number }[] {
  const num = (v: string | undefined) => {
    if (v === undefined) return null;
    const t = v.trim().replace(/[€$,\s"]/g, "");
    if (!t) return null;
    const pct = t.endsWith("%");
    const n = Number(pct ? t.slice(0, -1) : t);
    return Number.isFinite(n) ? (pct ? n / 100 : n) : null;
  };
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/("([^"]*)"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "")) ?? [])
    .filter((cells) => cells[0]?.trim() && num(cells[1]) !== null)
    .map((cells) => ({ key: cells[0].trim(), value: num(cells[1])! }));
}

export function toCode(name: string) {
  return name.toUpperCase().replace(/%/g, "PCT").replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^(\d)/, "K_$1").slice(0, 40);
}

/** "YYYY-MM" for a date (UTC). */
export function monthOf(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString("en-IE", { month: "short", year: "2-digit", timeZone: "UTC" });
}
