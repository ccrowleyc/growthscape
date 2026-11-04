import { db } from "@/lib/db";
import { requireCompanyAccess } from "@/lib/company-access";
import { ActionForm } from "@/components/ActionForm";
import { Button, Card, EmptyState, Field, Input } from "@/components/ui";
import { addOwner, removeOwner } from "../../actions";

export default async function OwnersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { canEdit } = await requireCompanyAccess(id);
  const owners = await db.owner.findMany({ where: { companyId: id }, orderBy: { name: "asc" } });

  return (
    <>
      <p className="-mt-4 mb-6 text-sm text-ink-soft">Owners are the people who can be assigned strategic initiatives.</p>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {owners.length === 0 ? (
            <EmptyState title="No owners yet" body="Add the people responsible for delivering strategic initiatives, such as your CRO or COO." />
          ) : (
            <Card className="divide-y divide-line">
              {owners.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-semibold text-ink-soft">
                      {o.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{o.name}</p>
                      <p className="text-xs text-ink-soft">{[o.title, o.email].filter(Boolean).join(" · ") || "—"}</p>
                    </div>
                  </div>
                  {canEdit && (
                    <form action={removeOwner}>
                      <input type="hidden" name="id" value={o.id} />
                      <Button variant="danger" className="text-xs">Remove</Button>
                    </form>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
        {canEdit && (
          <Card className="h-fit p-6">
            <h2 className="mb-5 text-base font-semibold">Add owner</h2>
            <ActionForm action={addOwner} submit="Add owner">
              <input type="hidden" name="companyId" value={id} />
              <Field label="Name"><Input name="name" required /></Field>
              <Field label="Title"><Input name="title" placeholder="e.g. Chief Revenue Officer" /></Field>
              <Field label="Email"><Input name="email" type="email" /></Field>
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  );
}
