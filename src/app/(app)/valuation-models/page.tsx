import { ComingSoon } from "@/components/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      title="Valuation Models"
      description="Define how a company is valued from its KPIs."
      bullets={["Name a model, e.g. “Conservative Model 2026”", "Add primary KPIs and coefficient KPIs", "Build a formula with averages, multiples, growth factors and conditions"]}
    />
  );
}
