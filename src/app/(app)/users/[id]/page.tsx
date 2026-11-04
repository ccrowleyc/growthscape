import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/ActionForm";
import { AccessFields } from "@/components/AccessFields";
import { Button, Card, PageHeader } from "@/components/ui";
import { deleteUser, updateAccess } from "../actions";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user: me } = await requireAdmin();
  const adminOf = await db.membership.findMany({ where: { userId: me.id, role: "ADMIN" }, include: { company: true }, orderBy: { company: { name: "asc" } } });
  const ids = adminOf.map((m) => m.companyId);
  const target = await db.user.findUnique({ where: { id }, include: { memberships: { where: { companyId: { in: ids } } } } });
  if (!target || target.memberships.length === 0 || target.id === me.id) notFound();

  return (
    <>
      <PageHeader title={target.name} description={target.email} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <ActionForm action={updateAccess} submit="Save access">
            <input type="hidden" name="userId" value={target.id} />
            <AccessFields
              companies={adminOf.map((m) => ({ id: m.companyId, name: m.company.name }))}
              selected={target.memberships.map((m) => m.companyId)}
              role={target.memberships.some((m) => m.role === "ADMIN") ? "ADMIN" : "MEMBER"}
            />
          </ActionForm>
        </Card>
        {target.createdById === me.id && (
          <Card className="h-fit p-6">
            <h2 className="mb-1 text-base font-semibold">Delete user</h2>
            <p className="mb-4 text-sm text-ink-soft">Removes their account and all their access.</p>
            <form action={deleteUser}>
              <input type="hidden" name="userId" value={target.id} />
              <Button variant="secondary" className="text-red-600">Delete {target.name}</Button>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
