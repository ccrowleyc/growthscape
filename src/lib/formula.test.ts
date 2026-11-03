import { strict as assert } from "node:assert";
import { test } from "node:test";
import { check, compute, parse } from "./formula";

const EXAMPLE =
  "AVG(MRR*12*30, EBITDA*15) * (1 + EBITDA_GROWTH) * (1 + ARR_GROWTH) * (NRR * 1.2) * IF(NPS > 25, 1.1, IF(NPS < 10, 0.9, 1)) * IF(OR(CUSTOMER_COUNT < 30, LARGEST_CUSTOMER_PCT > 15%), 0.9, 1)";

test("spec example formula", () => {
  const inputs = { MRR: 500_000, EBITDA: 1_800_000, EBITDA_GROWTH: 0.2, ARR_GROWTH: 0.3, NRR: 1.05, NPS: 30, CUSTOMER_COUNT: 120, LARGEST_CUSTOMER_PCT: 0.08 };
  const r = compute(EXAMPLE, inputs);
  assert.ok("value" in r);
  const base = (500_000 * 12 * 30 + 1_800_000 * 15) / 2;
  const expected = base * 1.2 * 1.3 * (1.05 * 1.2) * 1.1 * 1;
  assert.ok(Math.abs(r.value - expected) < 1e-6);
  assert.equal(r.steps.length, 6);
  assert.ok(Math.abs(r.steps.at(-1)!.running - expected) < 1e-6);
});

test("conditions", () => {
  const base = { MRR: 1, EBITDA: 1, EBITDA_GROWTH: 0, ARR_GROWTH: 0, NRR: 1 / 1.2, NPS: 5, CUSTOMER_COUNT: 20, LARGEST_CUSTOMER_PCT: 0 };
  const r = compute(EXAMPLE, base) as { value: number };
  assert.ok(Math.abs(r.value - ((360 + 15) / 2) * 0.9 * 0.9) < 1e-9);
});

test("precedence, unary, power, percent", () => {
  assert.equal((compute("2 + 3 * 4", {}) as { value: number }).value, 14);
  assert.equal((compute("-2 ^ 2", {}) as { value: number }).value, 4);
  assert.equal((compute("2 ^ 3 ^ 2", {}) as { value: number }).value, 512);
  assert.equal((compute("50% * 10", {}) as { value: number }).value, 5);
  assert.equal((compute("round(10/3, 2)", {}) as { value: number }).value, 3.33);
});

test("errors", () => {
  assert.throws(() => parse("1 +"));
  assert.throws(() => parse("FOO(1)"));
  assert.throws(() => parse("IF(1, 2)"));
  assert.deepEqual(compute("A / 0", { A: 1 }), { error: "Division by zero" });
  assert.deepEqual(compute("A + B", { A: 1 }), { error: "Missing value for B" });
  assert.equal(check("MRR * X", ["MRR"]).ok, false);
  assert.equal(check("mrr * 12", ["MRR"]).ok, true);
});
