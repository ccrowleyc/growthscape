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

type Suggestion = { name: string; unit: "CURRENCY" | "PERCENT" | "NUMBER"; direction: "HIGHER" | "LOWER" };
const s = (name: string, unit: Suggestion["unit"] = "PERCENT", direction: Suggestion["direction"] = "HIGHER"): Suggestion => ({ name, unit, direction });

/** Starter KPIs for each pillar. */
export const KPI_LIBRARY: Record<(typeof PILLARS)[number], Suggestion[]> = {
  "Market & Positioning": [s("Market share"), s("Win rate"), s("Brand awareness"), s("Share of pipeline from inbound")],
  "Product & Innovation": [s("Revenue from products < 3 years old"), s("R&D spend % of revenue"), s("Feature adoption rate"), s("Release frequency per quarter", "NUMBER")],
  "Revenue Growth": [s("ARR growth rate"), s("ARR", "CURRENCY"), s("Pipeline coverage", "NUMBER"), s("Average contract value", "CURRENCY"), s("Sales cycle (days)", "NUMBER", "LOWER")],
  "Operations & Scalability": [s("Revenue per employee", "CURRENCY"), s("Gross margin"), s("Implementation time (days)", "NUMBER", "LOWER"), s("Support tickets per customer", "NUMBER", "LOWER")],
  "Customer Success & Retention": [s("Net revenue retention"), s("Gross revenue retention"), s("Logo churn", "PERCENT", "LOWER"), s("Net promoter score", "NUMBER"), s("Customer count", "NUMBER")],
  "Financial Health": [s("EBITDA margin"), s("EBITDA", "CURRENCY"), s("Rule of 40", "NUMBER"), s("Cash runway (months)", "NUMBER"), s("CAC payback (months)", "NUMBER", "LOWER")],
  "Leadership & Talent": [s("Employee engagement"), s("Regretted attrition", "PERCENT", "LOWER"), s("Key roles with successors"), s("Time to hire (days)", "NUMBER", "LOWER")],
  "Governance & Risk": [s("Largest customer % of revenue", "PERCENT", "LOWER"), s("Open audit findings", "NUMBER", "LOWER"), s("Security incidents", "NUMBER", "LOWER"), s("Board meetings held", "NUMBER")],
};

export const SOURCES = [
  { id: "MANUAL", label: "Manual entry", live: true },
  { id: "CSV", label: "CSV import", live: true },
  { id: "HUBSPOT", label: "HubSpot", live: false },
  { id: "SALESFORCE", label: "Salesforce", live: false },
  { id: "XERO", label: "Xero", live: false },
  { id: "QUICKBOOKS", label: "QuickBooks", live: false },
  { id: "STRIPE", label: "Stripe", live: false },
] as const;

export type AKpi = { pillar: string; name: string; unit: string; direction: string; target: number | null; actual: number | null; prior: number | null; source: string; sourceDetail: string | null };

export type Rag = "green" | "amber" | "red" | "none";

/** Attainment vs target: 1 = on target. Lower-is-better KPIs are inverted. Capped at 150%. */
export function attainment(k: Pick<AKpi, "target" | "actual" | "direction">): number | null {
  if (k.actual === null || k.target === null) return null;
  if (k.direction === "LOWER") {
    if (k.actual <= 0) return 1.5;
    return Math.min(1.5, k.target / k.actual);
  }
  if (k.target === 0) return k.actual >= 0 ? 1 : 0;
  return Math.max(0, Math.min(1.5, k.actual / k.target));
}

export function rag(a: number | null): Rag {
  if (a === null) return "none";
  return a >= 1 ? "green" : a >= 0.8 ? "amber" : "red";
}

export function trend(k: Pick<AKpi, "actual" | "prior" | "direction">): "up" | "down" | "flat" | null {
  if (k.actual === null || k.prior === null) return null;
  const d = k.actual - k.prior;
  if (Math.abs(d) < 1e-12) return "flat";
  const better = k.direction === "LOWER" ? d < 0 : d > 0;
  return better ? "up" : "down";
}

export function analyse(kpis: AKpi[]) {
  const pillars = PILLARS.map((p) => {
    const list = kpis.filter((k) => k.pillar === p);
    const scores = list.map(attainment).filter((x): x is number => x !== null);
    const score = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    return { pillar: p, count: list.length, scored: scores.length, score, rag: rag(score) };
  });
  const scored = pillars.filter((p) => p.score !== null);
  const overall = scored.length ? scored.reduce((a, p) => a + p.score!, 0) / scored.length : null;
  const ranked = kpis.map((k) => ({ k, a: attainment(k) })).filter((x) => x.a !== null).sort((a, b) => a.a! - b.a!);
  return { pillars, overall, overallRag: rag(overall), weakest: ranked.slice(0, 3), strongest: ranked.slice(-3).reverse(), missing: kpis.filter((k) => k.actual === null).length };
}

/** Parse "KPI name,value[,prior]" rows. Values may use %, $ and thousands separators. */
export function parseCsv(text: string): { name: string; actual: number | null; prior: number | null }[] {
  const num = (v: string | undefined) => {
    if (v === undefined) return null;
    const t = v.trim().replace(/[$,\s"]/g, "");
    if (!t) return null;
    const pct = t.endsWith("%");
    const n = Number(pct ? t.slice(0, -1) : t);
    return Number.isFinite(n) ? (pct ? n / 100 : n) : null;
  };
  return text
    .split(/\r?\n/)
    .map((line) => line.match(/("([^"]*)"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "")) ?? [])
    .filter((cells) => cells[0]?.trim() && num(cells[1]) !== null)
    .map((cells) => ({ name: cells[0].trim(), actual: num(cells[1]), prior: num(cells[2]) }));
}
