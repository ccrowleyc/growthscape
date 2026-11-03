import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { kpiCatalog } from "@/lib/kpi-catalog";
import { label } from "@/lib/quarters";
import { initiativeStatus } from "@/lib/initiative-status";
import { money } from "@/lib/format";
import { Badge, Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";

export default async function InitiativesPage() {
  const { company } = await requireCompany();
  const [items, catalog] = await Promise.all([
    db.strategicInitiative.findMany({ where: { companyId: company.id }, include: { owner: true, adjustments: true }, orderBy: { startQuarter: "asc" } }),
    kpiCatalog(company.id),
  ]);
  const names = Object.fromEntries(catalog.map((k) => [k.code, k.name]));

  return (
    <>
      <PageHeader title="Strategic Initiatives" description="The projects that will move your KPIs, planned quarter by quarter." actions={items.length > 0 && <LinkButton href="/initiatives/new">New initiative</LinkButton>} />
      {items.length === 0 ? (
        <EmptyState title="No initiatives yet" body="Add an initiative such as “Create dedicated EMEA sales team”, choose the KPIs it moves, and plan its impact each quarter." action={<LinkButton href="/initiatives/new">Create an initiative</LinkButton>} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
              <tr><th className="px-5 py-3">Initiative</th><th className="px-5 py-3">Owner</th><th className="px-5 py-3">Period</th><th className="px-5 py-3">KPIs</th><th className="px-5 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((i) => {
                const s = initiativeStatus(i.adjustments);
                const codes: string[] = JSON.parse(i.kpiCodes);
                return (
                  <tr key={i.id} className="align-top hover:bg-muted/40">
                    <td className="px-5 py-3.5">
                      <Link href={`/initiatives/${i.id}`} className="font-medium hover:text-brand-700">{i.name}</Link>
                      {i.budget != null && <p className="text-xs text-ink-soft">Budget {money(i.budget)}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">{i.owner?.name ?? "Unassigned"}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-ink-soft">{label(i.startQuarter)} – {label(i.endQuarter)}</td>
                    <td className="px-5 py-3.5"><div className="flex flex-wrap gap-1">{codes.map((c) => <Badge key={c}>{names[c] ?? c}</Badge>)}</div></td>
                    <td className="px-5 py-3.5">
                      {s.behind > 0 ? <span className="text-sm font-medium text-red-600">{s.behind} behind plan</span>
                        : s.missing > 0 ? <span className="text-sm text-amber-600">{s.missing} actual{s.missing === 1 ? "" : "s"} due</span>
                        : s.ahead > 0 ? <span className="text-sm text-emerald-600">Ahead of plan</span>
                        : <span className="text-sm text-ink-soft">On plan</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
