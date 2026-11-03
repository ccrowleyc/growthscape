import { compute, type WalkStep } from "./formula";
import { elapsed } from "./quarters";

export type Adj = { quarter: string; kpiCode: string; planned: number | null; actual: number | null };
export type InitiativeLite = { id: string; name: string; adjustments: Adj[] };
export type OtherAdj = { label: string; kpiCode: string; amount: number };

type Inputs = Record<string, number | null>;

export type KpiRow = {
  code: string;
  baseline: number | null;
  initiatives: number;
  other: number;
  projected: number | null;
  target: number | null;
  actualToDate: number | null;
  plannedToDate: number;
};

export type PlanAnalysis = {
  rows: KpiRow[];
  baselineValue: number | null;
  projectedValue: number | null;
  targetValue: number | null;
  gap: number | null;
  gapPct: number | null;
  status: "on-track" | "above" | "short" | "incomplete";
  steps: WalkStep[];
  error: string | null;
  actualValueToDate: number | null;
  plannedValueToDate: number | null;
};

/**
 * Projected KPIs = baseline KPIs + every initiative's planned adjustments + other plan adjustments.
 * The projected valuation uses the target valuation's model, and is compared with the target value.
 */
export function analysePlan(args: {
  formula: string;
  codes: string[];
  baseline: Inputs;
  target: Inputs;
  targetValue: number | null;
  baselineValue: number | null;
  initiatives: InitiativeLite[];
  other: OtherAdj[];
  marginPct: number;
  now?: Date;
}): PlanAnalysis {
  const now = args.now ?? new Date();
  const sum = (code: string, pick: (a: Adj) => number | null, onlyElapsed = false) =>
    args.initiatives.reduce(
      (s, i) => s + i.adjustments.filter((a) => a.kpiCode === code && (!onlyElapsed || elapsed(a.quarter, now))).reduce((t, a) => t + (pick(a) ?? 0), 0),
      0,
    );

  const rows: KpiRow[] = args.codes.map((code) => {
    const baseline = args.baseline[code] ?? null;
    const initiatives = sum(code, (a) => a.planned);
    const other = args.other.filter((o) => o.kpiCode === code).reduce((s, o) => s + o.amount, 0);
    return {
      code,
      baseline,
      initiatives,
      other,
      projected: baseline === null ? null : baseline + initiatives + other,
      target: args.target[code] ?? null,
      plannedToDate: sum(code, (a) => a.planned, true),
      // Where an actual is missing for an elapsed quarter, fall back to plan
      actualToDate: baseline === null ? null : baseline + sum(code, (a) => a.actual ?? a.planned, true),
    };
  });

  const projected = Object.fromEntries(rows.map((r) => [r.code, r.projected]));
  const r = compute(args.formula, projected);
  const projectedValue = "value" in r ? r.value : null;
  const gap = projectedValue !== null && args.targetValue !== null ? projectedValue - args.targetValue : null;
  const gapPct = gap !== null && args.targetValue ? gap / args.targetValue : null;
  const status: PlanAnalysis["status"] =
    gapPct === null ? "incomplete" : Math.abs(gapPct) <= args.marginPct ? "on-track" : gapPct > 0 ? "above" : "short";

  const value = (pick: (row: KpiRow) => number | null) => {
    const c = compute(args.formula, Object.fromEntries(rows.map((row) => [row.code, pick(row)])));
    return "value" in c ? c.value : null;
  };

  return {
    rows,
    baselineValue: args.baselineValue,
    projectedValue,
    targetValue: args.targetValue,
    gap,
    gapPct,
    status,
    steps: "steps" in r ? r.steps : [],
    error: "error" in r ? r.error : null,
    actualValueToDate: value((row) => row.actualToDate),
    plannedValueToDate: value((row) => (row.baseline === null ? null : row.baseline + row.plannedToDate)),
  };
}

/** Variance of an actual against plan, signed so that negative means "behind plan". */
export function variance(planned: number | null, actual: number | null) {
  if (planned === null || actual === null) return null;
  const diff = actual - planned;
  const direction = planned === 0 ? 1 : Math.sign(planned);
  const behind = diff * direction < 0;
  const pct = planned !== 0 ? diff / Math.abs(planned) : null;
  return { diff, pct, behind, significant: pct === null ? diff !== 0 : Math.abs(pct) > 0.1 };
}
