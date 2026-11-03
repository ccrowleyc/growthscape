import { db } from "./db";
import { analysePlan } from "./plan";
import { liveValue, parseInputs } from "./valuation";

const include = {
  baseline: { include: { model: true } },
  target: { include: { model: { include: { kpis: { orderBy: { sortOrder: "asc" as const } } } } } },
  initiatives: { include: { initiative: { include: { adjustments: true, owner: true } } } },
  otherAdjustments: true,
};

export async function loadPlan(companyId: string, id: string) {
  return db.valueCreationPlan.findFirst({ where: { id, companyId }, include });
}
export async function loadPlans(companyId: string) {
  return db.valueCreationPlan.findMany({ where: { companyId }, include, orderBy: { updatedAt: "desc" } });
}

type Plan = NonNullable<Awaited<ReturnType<typeof loadPlan>>>;

export function analyse(plan: Plan, onlyInitiativeIds?: string[]) {
  const inits = plan.initiatives
    .map((pi) => pi.initiative)
    .filter((i) => !onlyInitiativeIds || onlyInitiativeIds.includes(i.id));
  return analysePlan({
    formula: plan.target.model.formula,
    codes: plan.target.model.kpis.map((k) => k.code),
    baseline: parseInputs(plan.baseline.inputs),
    target: parseInputs(plan.target.inputs),
    baselineValue: liveValue(plan.baseline).value,
    targetValue: liveValue(plan.target).value,
    initiatives: inits.map((i) => ({ id: i.id, name: i.name, adjustments: i.adjustments })),
    other: plan.otherAdjustments,
    marginPct: plan.marginPct,
  });
}
