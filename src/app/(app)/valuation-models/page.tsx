import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function ModelsPage() {
  const { company } = await requireCompany();
  const models = await db.valuationModel.findMany({
    where: { companyId: company.id },
    include: { kpis: true, _count: { select: { valuations: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Valuation Models"
        description={`How ${company.name} is valued from its KPIs.`}
        actions={models.length > 0 && <LinkButton href="/valuation-models/new">New model</LinkButton>}
      />
      {models.length === 0 ? (
        <EmptyState
          title="No valuation models yet"
          body="A model combines primary KPIs like MRR and EBITDA with coefficient KPIs like NRR and NPS in a formula."
          action={<LinkButton href="/valuation-models/new">Create your first model</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {models.map((m) => (
            <Link key={m.id} href={`/valuation-models/${m.id}`}>
              <Card className="h-full p-5 transition hover:border-brand-500 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold">{m.name}</h3>
                  <Badge>{m._count.valuations} valuation{m._count.valuations === 1 ? "" : "s"}</Badge>
                </div>
                {m.description && <p className="mt-1 text-sm text-ink-soft">{m.description}</p>}
                <p className="mt-3 text-xs text-ink-soft">
                  {m.kpis.filter((k) => k.kind === "PRIMARY").length} primary · {m.kpis.filter((k) => k.kind === "COEFFICIENT").length} coefficient KPIs
                </p>
                <pre className="mt-3 line-clamp-3 overflow-hidden whitespace-pre-wrap rounded bg-canvas p-2.5 font-mono text-[11px] text-ink-soft">{m.formula}</pre>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
