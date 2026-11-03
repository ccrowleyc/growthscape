import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { initiativeStatus } from "@/lib/initiative-status";
import { Button, PageHeader } from "@/components/ui";
import { InitiativeEditor } from "../InitiativeEditor";
import { loadEditorData } from "../load";
import { deleteInitiative } from "../actions";

export default async function InitiativePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const { company } = await requireCompany();
  const i = await db.strategicInitiative.findFirst({ where: { id, companyId: company.id }, include: { adjustments: true, owner: true } });
  if (!i) notFound();
  const data = await loadEditorData(company.id);
  const s = initiativeStatus(i.adjustments);

  return (
    <>
      <PageHeader
        title={i.name}
        description={i.owner ? `Owned by ${i.owner.name}` : "No owner assigned"}
        actions={<form action={deleteInitiative}><input type="hidden" name="id" value={i.id} /><Button variant="danger">Delete</Button></form>}
      />
      {saved && <p className="mb-4 rounded-md bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">Initiative saved.</p>}
      {s.behind > 0 && <p className="mb-4 rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-700">{s.behind} KPI-quarter{s.behind === 1 ? " is" : "s are"} more than 10% behind plan. They&apos;re highlighted below.</p>}
      {s.missing > 0 && <p className="mb-4 rounded-md bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{s.missing} actual{s.missing === 1 ? "" : "s"} still to enter for quarters that have ended.</p>}
      <InitiativeEditor
        key={i.updatedAt.toISOString()}
        {...data}
        initial={{
          id: i.id, name: i.name, description: i.description, ownerId: i.ownerId, budget: i.budget,
          startQuarter: i.startQuarter, endQuarter: i.endQuarter, kpiCodes: JSON.parse(i.kpiCodes),
          cells: i.adjustments.map(({ quarter, kpiCode, planned, actual }) => ({ quarter, kpiCode, planned, actual })),
        }}
      />
    </>
  );
}
