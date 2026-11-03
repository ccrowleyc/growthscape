export type KpiDraft = { code: string; name: string; kind: "PRIMARY" | "COEFFICIENT"; unit: "CURRENCY" | "PERCENT" | "NUMBER" };

/** The example model from the GrowthScape spec. */
export const EXAMPLE_MODEL: { kpis: KpiDraft[]; formula: string } = {
  kpis: [
    { code: "MRR", name: "Monthly recurring revenue", kind: "PRIMARY", unit: "CURRENCY" },
    { code: "EBITDA", name: "EBITDA", kind: "PRIMARY", unit: "CURRENCY" },
    { code: "EBITDA_GROWTH", name: "EBITDA annual growth rate", kind: "COEFFICIENT", unit: "PERCENT" },
    { code: "ARR_GROWTH", name: "ARR annual growth rate", kind: "COEFFICIENT", unit: "PERCENT" },
    { code: "NRR", name: "Net revenue retention", kind: "COEFFICIENT", unit: "PERCENT" },
    { code: "NPS", name: "Net promoter score", kind: "COEFFICIENT", unit: "NUMBER" },
    { code: "CUSTOMER_COUNT", name: "Customer count", kind: "COEFFICIENT", unit: "NUMBER" },
    { code: "LARGEST_CUSTOMER_PCT", name: "Largest customer % of revenue", kind: "COEFFICIENT", unit: "PERCENT" },
  ],
  formula: [
    "AVG(MRR * 12 * 30, EBITDA * 15)",
    "* (1 + EBITDA_GROWTH)",
    "* (1 + ARR_GROWTH)",
    "* (NRR * 1.2)",
    "* IF(NPS > 25, 1.1, IF(NPS < 10, 0.9, 1))",
    "* IF(OR(CUSTOMER_COUNT < 30, LARGEST_CUSTOMER_PCT > 15%), 0.9, 1)",
  ].join("\n"),
};

export function toCode(name: string) {
  return name.toUpperCase().replace(/%/g, "PCT").replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").replace(/^(\d)/, "K_$1").slice(0, 40);
}
