import { factor, money } from "@/lib/format";
import type { WalkStep } from "@/lib/formula";

/** Shows the base value then each multiplier, with the running valuation. */
export function ValuationWalk({ steps }: { steps: WalkStep[] }) {
  if (!steps.length) return null;
  return (
    <ol className="divide-y divide-line text-sm">
      {steps.map((s, i) => (
        <li key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-2.5">
          <code className="min-w-0 break-words text-xs text-ink-soft">{s.label}</code>
          <span className={`text-right tabular-nums ${i === 0 ? "" : s.factor > 1 ? "text-emerald-600" : s.factor < 1 ? "text-red-600" : "text-ink-faint"}`}>
            {i === 0 ? money(s.factor) : factor(s.factor)}
          </span>
          <span className="w-24 text-right font-medium tabular-nums">{money(s.running)}</span>
        </li>
      ))}
    </ol>
  );
}
