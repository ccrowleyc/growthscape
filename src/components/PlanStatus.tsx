import type { PlanAnalysis } from "@/lib/plan";
import { money } from "@/lib/format";

export function PlanStatusBadge({ a }: { a: PlanAnalysis }) {
  const map = {
    "on-track": ["bg-emerald-50 text-emerald-700", "On track"],
    above: ["bg-emerald-50 text-emerald-700", "Exceeds target"],
    short: ["bg-red-50 text-red-700", "Falls short"],
    incomplete: ["bg-muted text-ink-soft", "Incomplete"],
  } as const;
  const [cls, text] = map[a.status];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{text}</span>;
}

export function planSentence(a: PlanAnalysis, marginPct: number) {
  const m = `${+(marginPct * 100).toFixed(2)}%`;
  if (a.status === "incomplete") return a.error ? `The projection can't be calculated yet: ${a.error.replace("Missing value for", "no starting value for")}.` : "Choose a starting and target valuation.";
  const pct = `${Math.abs(a.gapPct! * 100).toFixed(1)}%`;
  if (a.status === "on-track") return `The initiatives reach ${money(a.projectedValue)}, within ${pct} of the target and inside your ${m} margin.`;
  if (a.status === "above") return `The initiatives reach ${money(a.projectedValue)}, ${pct} above the target.`;
  return `The initiatives reach ${money(a.projectedValue)}, ${money(Math.abs(a.gap!))} (${pct}) short of the target. Your margin is ${m}.`;
}
