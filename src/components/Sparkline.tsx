import { formatKpi } from "@/lib/format";
import { monthLabel } from "@/lib/kpis";

/** Small trend line of month-end values, with an optional dashed target line. */
export function Sparkline({ points, unit, target }: { points: { month: string; value: number }[]; unit: string; target: number | null }) {
  const W = 240, H = 56, P = 4;
  if (points.length < 2) {
    return <div className="grid h-14 place-items-center rounded bg-muted/50 text-[11px] text-ink-faint">History builds up at each month end</div>;
  }
  const vals = points.map((p) => p.value).concat(target !== null ? [target] : []);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const x = (i: number) => P + (i / (points.length - 1)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - 2 * P);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${d} L${x(points.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-14 w-full overflow-visible" role="img" aria-label={`Trend from ${monthLabel(points[0].month)} to ${monthLabel(last.month)}`}>
      <path d={area} className="fill-brand-500/10" />
      {target !== null && <line x1={P} x2={W - P} y1={y(target)} y2={y(target)} className="stroke-ink-faint" strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
      <path d={d} fill="none" className="stroke-brand-600" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {points.map((p, i) => (
        <circle key={p.month} cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 3 : 6} className={i === points.length - 1 ? "fill-brand-600" : "fill-transparent"}>
          <title>{`${monthLabel(p.month)}: ${formatKpi(p.value, unit)}`}</title>
        </circle>
      ))}
    </svg>
  );
}
