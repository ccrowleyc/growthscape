import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/ActionForm";
import { AccessFields } from "@/components/AccessFields";
import { Badge, Card, Field, Input, PageHeader } from "@/components/ui";
import { createUser } from "./actions";

export default async function AdminPage() {
  const { user: me } = await requireAdmin();
  const adminOf = await db.membership.findMany({ where: { userId: me.id, role: "ADMIN" }, include: { company: true }, orderBy: { company: { name: "asc" } } });
  const companyIds = adminOf.map((m) => m.companyId);
  const users = await db.user.findMany({
    where: { memberships: { some: { companyId: { in: companyIds } } } },
    include: { memberships: { where: { companyId: { in: companyIds } }, include: { company: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader title="Administration" description="Create users and choose which companies they can access." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit overflow-hidden lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
              <tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Companies</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{u.name} {u.id === me.id && <span className="text-xs font-normal text-ink-soft">(you)</span>}</p>
                    <p className="text-xs text-ink-soft">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {u.memberships.map((m) => <Badge key={m.id} tone={m.role === "ADMIN" ? "brand" : "neutral"}>{m.company.name}</Badge>)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {u.id !== me.id && <Link href={`/admin/users/${u.id}`} className="text-sm font-medium text-brand-700 hover:underline">Edit</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-line px-5 py-3 text-xs text-ink-soft">Blue badges mark admin access.</p>
        </Card>
        <Card className="h-fit p-6">
          <h2 className="mb-1 text-base font-semibold">New user</h2>
          <p className="mb-5 text-sm text-ink-soft">Share the temporary password with them. They can change it from their profile.</p>
          <ActionForm action={createUser} submit="Create user">
            <Field label="Name"><Input name="name" required /></Field>
            <Field label="Email"><Input name="email" type="email" required /></Field>
            <Field label="Temporary password" hint="At least 10 characters."><Input name="password" type="text" autoComplete="off" required /></Field>
            <AccessFields companies={adminOf.map((m) => ({ id: m.companyId, name: m.company.name }))} />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
