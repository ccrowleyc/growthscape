import { strict as assert } from "node:assert";
import { test } from "node:test";
import { KPI_LIBRARY, PILLARS, analyse, attainment, better, monthOf, parseCsv } from "./kpis";
import { EXAMPLE_MODEL } from "./model-templates";

test("attainment and direction", () => {
  assert.equal(attainment({ target: 100, currentValue: 80, direction: "HIGHER" }), 0.8);
  assert.equal(attainment({ target: 0.1, currentValue: 0.2, direction: "LOWER" }), 0.5);
  assert.equal(attainment({ target: 100, currentValue: 400, direction: "HIGHER" }), 1.5);
  assert.equal(better("LOWER", 0.08, 0.05), "up");
});

test("pillar analysis", () => {
  const base = { unit: "NUMBER", direction: "HIGHER", code: "X" };
  const r = analyse([
    { ...base, pillar: "Revenue Growth", name: "A", target: 100, currentValue: 100 },
    { ...base, pillar: "Revenue Growth", name: "B", target: 100, currentValue: 50 },
    { ...base, pillar: "Financial Health", name: "C", target: 10, currentValue: null },
  ]);
  assert.equal(r.pillars.find((p) => p.pillar === "Revenue Growth")!.score, 0.75);
  assert.equal(r.overall, 0.75);
  assert.equal(r.missing, 1);
});

test("csv", () => {
  assert.deepEqual(parseCsv('KPI,Value\n"ARR growth rate",32%\nARR,"€12,500,000"\nbad,\n'), [
    { key: "ARR growth rate", value: 0.32 },
    { key: "ARR", value: 12500000 },
  ]);
});

test("library covers the example valuation model and has unique codes", () => {
  const codes = PILLARS.flatMap((p) => KPI_LIBRARY[p].map((k) => k.code));
  assert.equal(new Set(codes).size, codes.length);
  for (const k of EXAMPLE_MODEL.kpis) assert.ok(codes.includes(k.code), k.code);
});

test("month", () => assert.equal(monthOf(new Date("2026-11-04T10:00:00Z")), "2026-11"));
