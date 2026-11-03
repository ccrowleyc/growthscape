import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { money } from "@/lib/format";
import { liveValue } from "@/lib/valuation";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function ValuationsPage() {
  const { company } = await requireCompany();
  const [valuations, modelCount] = await Promise.all([
    db.valuation.findMany({ where: { companyId: company.id }, include: { model: true }, orderBy: { asOf: "asc" } }),
    db.valuationModel.count({ where: { companyId: company.id } }),
  ]);
  const rows = valuations.map((v) => ({ ...v, live: liveValue(v) }));
  const current = rows.filter((r) => r.kind === "CURRENT").at(-1);
  const target = rows.filter((r) => r.kind === "TARGET").at(-1);
  const gap = current?.live.value != null && target?.live.value != null ? target.live.value - current.live.value : null;

  if (modelCount === 0) {
    return (
      <>
        <PageHeader title="Valuations" />
        <EmptyState title="Create a valuation model first" body="Valuations are calculated from a model's formula." action={<LinkButton href="/valuation-models/new">New valuation model</LinkButton>} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Valuations" description={`Current and target valuations for ${company.name.replace(/\.$/, "")}.`} actions={<LinkButton href="/valuations/new">New valuation</LinkButton>} />
      {rows.length === 0 ? (
        <EmptyState title="No valuations yet" body="Start with today's valuation, then add a target valuation for your plan." action={<LinkButton href="/valuations/new">Create a valuation</LinkButton>} />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Latest current", v: current?.live.value, sub: current?.name },
              { label: "Latest target", v: target?.live.value, sub: target?.name },
              { label: "Value to create", v: gap, sub: gap != null && current?.live.value ? `${((gap / current.live.value) * 100).toFixed(0)}% uplift` : "Needs a current and a target" },
            ].map((s) => (
              <Card key={s.label} className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{s.label}</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">{money(s.v)}</p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">{s.sub ?? "—"}</p>
              </Card>
            ))}
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                <tr><th className="px-5 py-3">Valuation</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Model</th><th className="px-5 py-3 text-right">Value</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/40">
                    <td className="px-5 py-3.5"><Link href={`/valuations/${v.id}`} className="font-medium hover:text-brand-700">{v.name}</Link></td>
                    <td className="px-5 py-3.5"><Badge tone={v.kind === "TARGET" ? "brand" : "neutral"}>{v.kind === "TARGET" ? "Target" : "Current"}</Badge></td>
                    <td className="px-5 py-3.5 text-ink-soft">{v.asOf.toISOString().slice(0, 10)}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{v.model.name}</td>
                    <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                      {money(v.live.value)}
                      {v.live.drift && <span title="The model changed since this was saved" className="ml-1.5 text-amber-500">●</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {rows.some((r) => r.live.drift) && <p className="mt-3 text-xs text-ink-soft"><span className="text-amber-500">●</span> The model has changed since this valuation was saved. The value shown uses the latest model.</p>}
        </>
      )}
    </>
  );
}
