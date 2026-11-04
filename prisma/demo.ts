import type { PrismaClient } from "@prisma/client";
import { compute } from "../src/lib/formula";
import { EXAMPLE_MODEL } from "../src/lib/model-templates";

/**
 * Demo Inc.: a fully populated company for demos and testing.
 * Created once; if it already exists it is left untouched.
 */

export const DEMO_NAME = "Demo Inc.";

type K = {
  code: string; pillar: string; name: string; unit: "CURRENCY" | "PERCENT" | "NUMBER"; direction: "HIGHER" | "LOWER";
  target: number; start: number; end: number; source: string; detail?: string; round?: number;
};

const KPIS: K[] = [
  { code: "MARKET_SHARE", pillar: "Market & Positioning", name: "Market share", unit: "PERCENT", direction: "HIGHER", target: 0.12, start: 0.08, end: 0.11, source: "MANUAL" },
  { code: "WIN_RATE", pillar: "Market & Positioning", name: "Win rate", unit: "PERCENT", direction: "HIGHER", target: 0.3, start: 0.22, end: 0.27, source: "SALESFORCE", detail: "Opportunity win rate report" },
  { code: "INBOUND_PIPELINE_PCT", pillar: "Market & Positioning", name: "Pipeline from inbound", unit: "PERCENT", direction: "HIGHER", target: 0.45, start: 0.35, end: 0.42, source: "HUBSPOT", detail: "Deals by original source" },
  { code: "FEATURE_ADOPTION", pillar: "Product & Innovation", name: "Feature adoption rate", unit: "PERCENT", direction: "HIGHER", target: 0.6, start: 0.45, end: 0.61, source: "MANUAL" },
  { code: "RND_PCT_REVENUE", pillar: "Product & Innovation", name: "R&D spend % of revenue", unit: "PERCENT", direction: "HIGHER", target: 0.15, start: 0.14, end: 0.16, source: "XERO", detail: "P&L: Research & development" },
  { code: "RELEASES_PER_QUARTER", pillar: "Product & Innovation", name: "Releases per quarter", unit: "NUMBER", direction: "HIGHER", target: 8, start: 6, end: 9, source: "MANUAL", round: 0 },
  { code: "MRR", pillar: "Revenue Growth", name: "Monthly recurring revenue", unit: "CURRENCY", direction: "HIGHER", target: 700000, start: 420000, end: 610000, source: "STRIPE", detail: "MRR", round: -3 },
  { code: "ARR_GROWTH", pillar: "Revenue Growth", name: "ARR annual growth rate", unit: "PERCENT", direction: "HIGHER", target: 0.35, start: 0.22, end: 0.31, source: "STRIPE", detail: "ARR year-on-year" },
  { code: "PIPELINE_COVERAGE", pillar: "Revenue Growth", name: "Pipeline coverage", unit: "NUMBER", direction: "HIGHER", target: 3.5, start: 2.6, end: 3.2, source: "SALESFORCE", detail: "Pipeline ÷ quota", round: 1 },
  { code: "ACV", pillar: "Revenue Growth", name: "Average contract value", unit: "CURRENCY", direction: "HIGHER", target: 36000, start: 28000, end: 34000, source: "SALESFORCE", detail: "Closed-won ACV", round: -2 },
  { code: "SALES_CYCLE_DAYS", pillar: "Revenue Growth", name: "Sales cycle (days)", unit: "NUMBER", direction: "LOWER", target: 70, start: 95, end: 78, source: "SALESFORCE", detail: "Avg days to close", round: 0 },
  { code: "GROSS_MARGIN", pillar: "Operations & Scalability", name: "Gross margin", unit: "PERCENT", direction: "HIGHER", target: 0.78, start: 0.71, end: 0.76, source: "XERO", detail: "P&L: Gross profit %" },
  { code: "REVENUE_PER_EMPLOYEE", pillar: "Operations & Scalability", name: "Revenue per employee", unit: "CURRENCY", direction: "HIGHER", target: 180000, start: 140000, end: 168000, source: "MANUAL", round: -3 },
  { code: "IMPLEMENTATION_DAYS", pillar: "Operations & Scalability", name: "Implementation time (days)", unit: "NUMBER", direction: "LOWER", target: 30, start: 45, end: 32, source: "MANUAL", round: 0 },
  { code: "NRR", pillar: "Customer Success & Retention", name: "Net revenue retention", unit: "PERCENT", direction: "HIGHER", target: 1.12, start: 1.02, end: 1.08, source: "STRIPE", detail: "Net revenue retention" },
  { code: "LOGO_CHURN", pillar: "Customer Success & Retention", name: "Logo churn", unit: "PERCENT", direction: "LOWER", target: 0.06, start: 0.09, end: 0.07, source: "HUBSPOT", detail: "Churned companies ÷ total" },
  { code: "NPS", pillar: "Customer Success & Retention", name: "Net promoter score", unit: "NUMBER", direction: "HIGHER", target: 40, start: 24, end: 38, source: "HUBSPOT", detail: "NPS survey", round: 0 },
  { code: "CUSTOMER_COUNT", pillar: "Customer Success & Retention", name: "Customer count", unit: "NUMBER", direction: "HIGHER", target: 240, start: 140, end: 205, source: "HUBSPOT", detail: "Companies with lifecycle stage = Customer", round: 0 },
  { code: "EBITDA", pillar: "Financial Health", name: "EBITDA", unit: "CURRENCY", direction: "HIGHER", target: 2500000, start: 1100000, end: 2000000, source: "XERO", detail: "P&L: EBITDA (trailing 12 months)", round: -4 },
  { code: "EBITDA_GROWTH", pillar: "Financial Health", name: "EBITDA annual growth rate", unit: "PERCENT", direction: "HIGHER", target: 0.25, start: 0.12, end: 0.24, source: "XERO", detail: "EBITDA year-on-year" },
  { code: "EBITDA_MARGIN", pillar: "Financial Health", name: "EBITDA margin", unit: "PERCENT", direction: "HIGHER", target: 0.25, start: 0.16, end: 0.22, source: "XERO", detail: "P&L: EBITDA %" },
  { code: "CASH_RUNWAY_MONTHS", pillar: "Financial Health", name: "Cash runway (months)", unit: "NUMBER", direction: "HIGHER", target: 24, start: 20, end: 26, source: "XERO", detail: "Cash ÷ monthly burn", round: 0 },
  { code: "EMPLOYEE_ENGAGEMENT", pillar: "Leadership & Talent", name: "Employee engagement", unit: "PERCENT", direction: "HIGHER", target: 0.8, start: 0.7, end: 0.76, source: "MANUAL" },
  { code: "REGRETTED_ATTRITION", pillar: "Leadership & Talent", name: "Regretted attrition", unit: "PERCENT", direction: "LOWER", target: 0.07, start: 0.11, end: 0.08, source: "MANUAL" },
  { code: "LARGEST_CUSTOMER_PCT", pillar: "Governance & Risk", name: "Largest customer % of revenue", unit: "PERCENT", direction: "LOWER", target: 0.1, start: 0.14, end: 0.09, source: "STRIPE", detail: "Top customer ÷ total revenue" },
  { code: "OPEN_AUDIT_FINDINGS", pillar: "Governance & Risk", name: "Open audit findings", unit: "NUMBER", direction: "LOWER", target: 1, start: 6, end: 2, source: "MANUAL", round: 0 },
  { code: "SECURITY_INCIDENTS", pillar: "Governance & Risk", name: "Security incidents", unit: "NUMBER", direction: "LOWER", target: 1, start: 3, end: 1, source: "MANUAL", round: 0 },
];

/** Deterministic pseudo-random numbers so the demo looks the same every time. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function months(endExclusive: Date, count: number) {
  const out: string[] = [];
  for (let i = count; i >= 1; i--) {
    const d = new Date(Date.UTC(endExclusive.getUTCFullYear(), endExclusive.getUTCMonth() - i, 1));
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

const roundTo = (v: number, k: K) =>
  k.unit === "PERCENT" ? Math.round(v * 1000) / 1000 : k.round === undefined ? Math.round(v * 100) / 100 : Math.round(v * 10 ** k.round) / 10 ** k.round;

function quarterOf(d: Date) {
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}
function quarterRange(start: string, end: string) {
  const idx = (q: string) => +q.slice(0, 4) * 4 + (+q.slice(6) - 1);
  const out: string[] = [];
  for (let i = idx(start); i <= idx(end); i++) out.push(`${Math.floor(i / 4)}-Q${(i % 4) + 1}`);
  return out;
}

export async function seedDemo(prisma: PrismaClient, adminId: string, now = new Date()) {
  if (await prisma.company.findUnique({ where: { name: DEMO_NAME } })) return false;

  const company = await prisma.company.create({ data: { name: DEMO_NAME, memberships: { create: { userId: adminId, role: "ADMIN" } } } });
  const companyId = company.id;

  // KPIs with 24 months of month-end history and a current value
  const hist = months(now, 24);
  const rand = rng(42);
  const series: Record<string, Record<string, number>> = {};
  for (const [i, k] of KPIS.entries()) {
    const values: Record<string, number> = {};
    hist.forEach((m, j) => {
      const t = j / (hist.length - 1);
      const trend = k.start + (k.end - k.start) * t;
      const noise = (rand() - 0.5) * Math.abs(k.end - k.start) * 0.25;
      values[m] = roundTo(trend + noise, k);
    });
    series[k.code] = values;
    const current = roundTo(k.end + (rand() - 0.3) * Math.abs(k.end - k.start) * 0.05, k);
    await prisma.companyKpi.create({
      data: {
        companyId, pillar: k.pillar, code: k.code, name: k.name, unit: k.unit, direction: k.direction, target: k.target,
        currentValue: current, currentAsOf: now, source: k.source, sourceDetail: k.detail ?? null, sortOrder: i,
        snapshots: { create: hist.map((month) => ({ month, value: values[month] })) },
      },
    });
  }
  const kpiMeta = new Map(KPIS.map((k) => [k.code, k]));

  // Owners
  const ownerData = [
    ["Aoife Byrne", "Chief Revenue Officer", "aoife.byrne@demo.example"],
    ["Liam O'Connor", "Chief Operating Officer", "liam.oconnor@demo.example"],
    ["Sofia Rossi", "Chief Product Officer", "sofia.rossi@demo.example"],
    ["Daniel Meyer", "Chief Financial Officer", "daniel.meyer@demo.example"],
    ["Niamh Kelly", "VP Customer Success", "niamh.kelly@demo.example"],
  ];
  const owners: Record<string, string> = {};
  for (const [name, title, email] of ownerData) owners[name] = (await prisma.owner.create({ data: { companyId, name, title, email } })).id;

  // Valuation models
  const mk = (codes: { code: string; kind: string }[]) =>
    codes.map((c, i) => ({ code: c.code, kind: c.kind, name: kpiMeta.get(c.code)!.name, unit: kpiMeta.get(c.code)!.unit, sortOrder: i }));
  const conservative = await prisma.valuationModel.create({
    data: { companyId, name: "Conservative Model 2026", description: "Blend of revenue and EBITDA multiples with retention and risk adjustments.", formula: EXAMPLE_MODEL.formula, kpis: { create: mk(EXAMPLE_MODEL.kpis) } },
  });
  const growthFormula = "AVG(MRR * 12 * 40, EBITDA * 18)\n* (1 + ARR_GROWTH)\n* NRR\n* IF(NPS > 30, 1.1, 1)\n* IF(LARGEST_CUSTOMER_PCT > 15%, 0.85, 1)";
  await prisma.valuationModel.create({
    data: {
      companyId, name: "Growth Model 2026", description: "Higher multiples for a strong growth story.", formula: growthFormula,
      kpis: { create: mk([{ code: "MRR", kind: "PRIMARY" }, { code: "EBITDA", kind: "PRIMARY" }, { code: "ARR_GROWTH", kind: "COEFFICIENT" }, { code: "NRR", kind: "COEFFICIENT" }, { code: "NPS", kind: "COEFFICIENT" }, { code: "LARGEST_CUSTOMER_PCT", kind: "COEFFICIENT" }]) },
    },
  });

  // Point-in-time valuations at each quarter end, from the KPI history
  const codes = EXAMPLE_MODEL.kpis.map((k) => k.code);
  const inputsAt = (month: string) => Object.fromEntries(codes.map((c) => [c, series[c][month]]));
  const valuationIds: string[] = [];
  for (const month of hist.filter((m) => ["03", "06", "09", "12"].includes(m.slice(5)))) {
    const [y, mo] = month.split("-").map(Number);
    const asOf = new Date(Date.UTC(y, mo, 0));
    const inputs = inputsAt(month);
    const r = compute(EXAMPLE_MODEL.formula, inputs);
    const label = asOf.toLocaleString("en-IE", { month: "short", year: "numeric", timeZone: "UTC" });
    const v = await prisma.valuation.create({
      data: { companyId, modelId: conservative.id, name: `${label} Valuation – Conservative`, kind: "CURRENT", asOf, inputs: JSON.stringify(inputs), savedValue: "value" in r ? r.value : null },
    });
    valuationIds.push(v.id);
  }

  // Target valuations
  const targets = [
    { name: "2028 Target Valuation", asOf: new Date(Date.UTC(2028, 11, 31)), inputs: { MRR: 900000, EBITDA: 3200000, EBITDA_GROWTH: 0.25, ARR_GROWTH: 0.32, NRR: 1.12, NPS: 42, CUSTOMER_COUNT: 300, LARGEST_CUSTOMER_PCT: 0.08 } },
    { name: "2030 Target Valuation", asOf: new Date(Date.UTC(2030, 11, 31)), inputs: { MRR: 1250000, EBITDA: 4800000, EBITDA_GROWTH: 0.25, ARR_GROWTH: 0.3, NRR: 1.15, NPS: 45, CUSTOMER_COUNT: 400, LARGEST_CUSTOMER_PCT: 0.07 } },
  ];
  const targetIds: string[] = [];
  for (const t of targets) {
    const r = compute(EXAMPLE_MODEL.formula, t.inputs);
    targetIds.push((await prisma.valuation.create({ data: { companyId, modelId: conservative.id, name: t.name, kind: "TARGET", asOf: t.asOf, inputs: JSON.stringify(t.inputs), savedValue: "value" in r ? r.value : null } })).id);
  }

  // Strategic initiatives with quarterly plan and actuals for quarters that have ended
  const nowQ = quarterOf(now);
  const idx = (q: string) => +q.slice(0, 4) * 4 + (+q.slice(6) - 1);
  const inits: { name: string; description: string; owner: string; start: string; end: string; budget: number; plan: Record<string, number>; perf: number }[] = [
    { name: "Create dedicated EMEA sales team", description: "Hire a regional sales director and four account executives.", owner: "Aoife Byrne", start: "2025-Q3", end: "2029-Q4", budget: 2400000, plan: { MRR: 22000, CUSTOMER_COUNT: 6 }, perf: 0.82 },
    { name: "Customer success programme", description: "Proactive onboarding, health scores and quarterly business reviews.", owner: "Niamh Kelly", start: "2025-Q4", end: "2028-Q4", budget: 900000, plan: { NRR: 0.004, NPS: 0.8, LOGO_CHURN: -0.0015 }, perf: 1.05 },
    { name: "Pricing and packaging refresh", description: "Introduce tiered plans and annual price indexation.", owner: "Sofia Rossi", start: "2026-Q1", end: "2027-Q4", budget: 250000, plan: { MRR: 15000, ACV: 600 }, perf: 1.1 },
    { name: "Operational efficiency", description: "Automate billing and support triage; consolidate tooling.", owner: "Liam O'Connor", start: "2026-Q2", end: "2029-Q4", budget: 600000, plan: { EBITDA: 140000, GROSS_MARGIN: 0.002 }, perf: 0.7 },
    { name: "Diversify the customer base", description: "Mid-market campaign to reduce reliance on the largest accounts.", owner: "Daniel Meyer", start: "2026-Q1", end: "2029-Q4", budget: 400000, plan: { LARGEST_CUSTOMER_PCT: -0.003, CUSTOMER_COUNT: 4 }, perf: 0.95 },
  ];
  const initIds: string[] = [];
  const r2 = rng(7);
  for (const it of inits) {
    const qs = quarterRange(it.start, it.end);
    const adjustments = qs.flatMap((q) =>
      Object.entries(it.plan).map(([code, planned]) => {
        const elapsed = idx(q) < idx(nowQ);
        const k = kpiMeta.get(code)!;
        const actual = elapsed ? roundTo(planned * (it.perf + (r2() - 0.5) * 0.2), k) : null;
        return { quarter: q, kpiCode: code, planned, actual };
      }),
    );
    const created = await prisma.strategicInitiative.create({
      data: {
        companyId, name: it.name, description: it.description, ownerId: owners[it.owner], startQuarter: it.start, endQuarter: it.end, budget: it.budget,
        kpiCodes: JSON.stringify(Object.keys(it.plan)), adjustments: { create: adjustments },
      },
    });
    initIds.push(created.id);
  }

  // Value creation plan from the latest point-in-time valuation to the 2030 target
  await prisma.valueCreationPlan.create({
    data: {
      companyId, name: "2030 Strategic Plan", description: "Grow recurring revenue and margin to reach the 2030 target valuation.",
      baselineValuationId: valuationIds[valuationIds.length - 1], targetValuationId: targetIds[1], marginPct: 0.05,
      initiatives: { create: initIds.map((initiativeId) => ({ initiativeId })) },
      otherAdjustments: {
        create: [
          { label: "Inflation on costs", kpiCode: "EBITDA", amount: -350000 },
          { label: "Organic market growth", kpiCode: "MRR", amount: 150000 },
          { label: "Market-wide EBITDA growth", kpiCode: "EBITDA_GROWTH", amount: 0.01 },
        ],
      },
    },
  });
  return true;
}
