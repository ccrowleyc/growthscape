import type { Rag } from "@/lib/kpis";

export const RAG_CLASS: Record<Rag, { bar: string; text: string; chip: string; label: string }> = {
  green: { bar: "bg-emerald-500", text: "text-emerald-700", chip: "bg-emerald-50 text-emerald-700", label: "On target" },
  amber: { bar: "bg-amber-400", text: "text-amber-700", chip: "bg-amber-50 text-amber-800", label: "Near target" },
  red: { bar: "bg-red-500", text: "text-red-700", chip: "bg-red-50 text-red-700", label: "Below target" },
  none: { bar: "bg-line", text: "text-ink-faint", chip: "bg-muted text-ink-soft", label: "No data" },
};

export function ScoreBar({ score, rag }: { score: number | null; rag: Rag }) {
  const pct = score === null ? 0 : Math.min(score, 1.5) / 1.5;
  return (
    <div className="relative h-2 w-full rounded-full bg-muted">
      <div className={`h-2 rounded-full ${RAG_CLASS[rag].bar}`} style={{ width: `${pct * 100}%` }} />
      <div className="absolute top-[-3px] h-3.5 w-px bg-ink/40" style={{ left: `${(1 / 1.5) * 100}%` }} title="Target" />
    </div>
  );
}
