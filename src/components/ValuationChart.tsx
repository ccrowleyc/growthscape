import { money, moneyAxis } from "@/lib/format";

type Pt = { id: string; name: string; date: Date; value: number; kind: string };

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || Math.abs(max) || 1;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0)!;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(v);
  return ticks;
}

/** Point-in-time valuations over time as a line, with target valuations as hollow markers. */
export function ValuationChart({ points }: { points: Pt[] }) {
  const pit = points.filter((p) => p.kind !== "TARGET").sort((a, b) => +a.date - +b.date);
  const targets = points.filter((p) => p.kind === "TARGET").sort((a, b) => +a.date - +b.date);
  if (points.length === 0) return null;
  const W = 720, H = 260, L = 64, R = 16, T = 16, B = 32;
  const t0 = Math.min(...points.map((p) => +p.date)), t1 = Math.max(...points.map((p) => +p.date));
  const ticks = niceTicks(Math.min(0, ...points.map((p) => p.value)), Math.max(...points.map((p) => p.value)));
  const vmin = ticks[0], vmax = ticks[ticks.length - 1];
  const x = (d: Date) => (t1 === t0 ? (L + W - R) / 2 : L + ((+d - t0) / (t1 - t0)) * (W - L - R));
  const y = (v: number) => T + (1 - (v - vmin) / (vmax - vmin || 1)) * (H - T - B);
  const years: number[] = [];
  for (let yv = new Date(t0).getUTCFullYear(); yv <= new Date(t1).getUTCFullYear() + 1; yv++) {
    const t = Date.UTC(yv, 0, 1);
    if (t >= t0 && t <= t1) years.push(yv);
  }
  const line = pit.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const lastPit = pit.at(-1);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Valuation over time">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth="1" />
            <text x={L - 8} y={y(t)} dy="0.35em" textAnchor="end" className="fill-ink-faint text-[10px]">{moneyAxis(t)}</text>
          </g>
        ))}
        {years.map((yv) => (
          <text key={yv} x={x(new Date(Date.UTC(yv, 0, 1)))} y={H - 10} textAnchor="middle" className="fill-ink-faint text-[10px]">{yv}</text>
        ))}
        {lastPit && targets.map((t) => (
          <line key={t.id} x1={x(lastPit.date)} y1={y(lastPit.value)} x2={x(t.date)} y2={y(t.value)} className="stroke-brand-500" strokeDasharray="4 4" strokeWidth="1.5" />
        ))}
        {pit.length > 1 && <path d={line} fill="none" className="stroke-ink" strokeWidth="2" strokeLinejoin="round" />}
        {pit.map((p) => (
          <circle key={p.id} cx={x(p.date)} cy={y(p.value)} r="4" className="fill-ink stroke-surface" strokeWidth="2"><title>{`${p.name}: ${money(p.value)}`}</title></circle>
        ))}
        {targets.map((t) => (
          <rect key={t.id} x={x(t.date) - 5} y={y(t.value) - 5} width="10" height="10" transform={`rotate(45 ${x(t.date)} ${y(t.value)})`} className="fill-surface stroke-brand-600" strokeWidth="2"><title>{`${t.name}: ${money(t.value)}`}</title></rect>
        ))}
      </svg>
      <div className="mt-2 flex gap-5 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink" />Point-in-time</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rotate-45 border-2 border-brand-600" />Target</span>
      </div>
    </div>
  );
}
