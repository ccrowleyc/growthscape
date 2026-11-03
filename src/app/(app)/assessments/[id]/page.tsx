import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { Button, PageHeader } from "@/components/ui";
import { AssessmentEditor } from "../AssessmentEditor";
import { deleteAssessment } from "../actions";

export default async function AssessmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> }) {
  const [{ id }, { step }] = await Promise.all([params, searchParams]);
  const { company } = await requireCompany();
  const a = await db.assessment.findFirst({ where: { id, companyId: company.id }, include: { kpis: { orderBy: { sortOrder: "asc" } } } });
  if (!a) notFound();
  return (
    <>
      <PageHeader
        title="Assessment"
        description={`${company.name} · as of ${a.asOf.toISOString().slice(0, 10)}`}
        actions={<form action={deleteAssessment}><input type="hidden" name="id" value={a.id} /><Button variant="danger">Delete</Button></form>}
      />
      <AssessmentEditor
        key={a.updatedAt.toISOString()}
        id={a.id}
        name={a.name}
        initialStep={Math.min(3, Math.max(1, Number(step) || 1))}
        initialKpis={a.kpis.map(({ pillar, name, unit, direction, target, actual, prior, source, sourceDetail }) => ({ pillar, name, unit, direction, target, actual, prior, source, sourceDetail }))}
      />
    </>
  );
}
