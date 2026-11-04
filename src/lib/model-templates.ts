export type ModelKpiDraft = { code: string; kind: "PRIMARY" | "COEFFICIENT" };

/** The example model from the GrowthScape spec. Its KPI codes match the KPI library. */
export const EXAMPLE_MODEL: { kpis: ModelKpiDraft[]; formula: string } = {
  kpis: [
    { code: "MRR", kind: "PRIMARY" },
    { code: "EBITDA", kind: "PRIMARY" },
    { code: "EBITDA_GROWTH", kind: "COEFFICIENT" },
    { code: "ARR_GROWTH", kind: "COEFFICIENT" },
    { code: "NRR", kind: "COEFFICIENT" },
    { code: "NPS", kind: "COEFFICIENT" },
    { code: "CUSTOMER_COUNT", kind: "COEFFICIENT" },
    { code: "LARGEST_CUSTOMER_PCT", kind: "COEFFICIENT" },
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
