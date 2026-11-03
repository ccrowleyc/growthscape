import { ComingSoon } from "@/components/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      title="Assessments"
      description="Measure company performance across the eight growth pillars."
      bullets={[
        "Choose KPIs across Market & Positioning, Product & Innovation, Revenue Growth, Operations & Scalability, Customer Success & Retention, Financial Health, Leadership & Talent, and Governance & Risk",
        "Connect each KPI to its data source",
        "Analyse KPI performance",
      ]}
    />
  );
}
