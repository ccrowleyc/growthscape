import { strict as assert } from "node:assert";
import { test } from "node:test";
import { analysePlan, variance } from "./plan";
import { elapsed, range } from "./quarters";

test("quarters", () => {
  assert.deepEqual(range("2026-Q3", "2027-Q2"), ["2026-Q3", "2026-Q4", "2027-Q1", "2027-Q2"]);
  const now = new Date("2026-11-03T00:00:00Z");
  assert.equal(elapsed("2026-Q3", now), true);
  assert.equal(elapsed("2026-Q4", now), false);
});

test("plan reaches target within margin", () => {
  const a = analysePlan({
    formula: "MRR * 12 * 10",
    codes: ["MRR"],
    baseline: { MRR: 100 },
    target: { MRR: 200 },
    baselineValue: 12000,
    targetValue: 24000,
    initiatives: [{ id: "i", name: "EMEA", adjustments: [
      { quarter: "2020-Q1", kpiCode: "MRR", planned: 60, actual: 40 },
      { quarter: "2099-Q1", kpiCode: "MRR", planned: 50, actual: null },
    ] }],
    other: [{ label: "Churn", kpiCode: "MRR", amount: -15 }],
    marginPct: 0.05,
  });
  assert.equal(a.rows[0].projected, 195);
  assert.equal(a.projectedValue, 23400);
  assert.equal(a.status, "on-track");
  assert.equal(a.rows[0].actualToDate, 140);
  assert.equal(a.plannedValueToDate, 160 * 120);
});

test("variance direction", () => {
  assert.equal(variance(10, 8)!.behind, true);
  assert.equal(variance(-0.02, -0.03)!.behind, false);
  assert.equal(variance(10, 9.5)!.significant, false);
});
