import { ComingSoon } from "@/components/ComingSoon";

export default function Page() {
  return (
    <ComingSoon
      title="Valuations"
      description="Current and target valuations calculated from a valuation model."
      bullets={["Create a named valuation, e.g. “Dec 2025 Valuation – Conservative” or “2030 Target Valuation”", "Pick a valuation model and enter KPI inputs", "The valuation is calculated automatically", "Value Creation Plans and Strategic Initiatives build on target valuations"]}
    />
  );
}
