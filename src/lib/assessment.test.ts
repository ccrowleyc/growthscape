import { strict as assert } from "node:assert";
import { test } from "node:test";
import { analyse, attainment, parseCsv, trend } from "./assessment";

test("attainment and direction", () => {
  assert.equal(attainment({ target: 100, actual: 80, direction: "HIGHER" }), 0.8);
  assert.equal(attainment({ target: 0.1, actual: 0.2, direction: "LOWER" }), 0.5);
  assert.equal(attainment({ target: 100, actual: 400, direction: "HIGHER" }), 1.5);
  assert.equal(trend({ actual: 0.05, prior: 0.08, direction: "LOWER" }), "up");
});

test("pillar analysis", () => {
  const base = { unit: "NUMBER", direction: "HIGHER", prior: null, source: "MANUAL", sourceDetail: null };
  const r = analyse([
    { ...base, pillar: "Revenue Growth", name: "A", target: 100, actual: 100 },
    { ...base, pillar: "Revenue Growth", name: "B", target: 100, actual: 50 },
    { ...base, pillar: "Financial Health", name: "C", target: 10, actual: null },
  ]);
  assert.equal(r.pillars.find((p) => p.pillar === "Revenue Growth")!.score, 0.75);
  assert.equal(r.overall, 0.75);
  assert.equal(r.missing, 1);
});

test("csv", () => {
  const rows = parseCsv('KPI,Value,Prior\n"ARR growth rate",32%,25%\nARR,"$12,500,000",\nbad,\n');
  assert.deepEqual(rows, [
    { name: "ARR growth rate", actual: 0.32, prior: 0.25 },
    { name: "ARR", actual: 12500000, prior: null },
  ]);
});
