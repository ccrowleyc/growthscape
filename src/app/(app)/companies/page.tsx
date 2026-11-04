import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { ActionForm } from "@/components/ActionForm";
import { Badge, Card, Field, Input, PageHeader } from "@/components/ui";
import { createCompany } from "./actions";

export default async function CompaniesPage() {
  const { user, company: current, role } = await requireCompany();
  const isAdmin = user.isAdmin || role === "ADMIN";
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { company: { include: { _count: { select: { owners: true, memberships: true } } } } },
    orderBy: { company: { name: "asc" } },
  });

  return (
    <>
      <PageHeader title="Companies" description="Portfolio companies you have access to." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit overflow-hidden lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
              <tr><th className="px-5 py-3">Company</th><th className="px-5 py-3">Owners</th><th className="px-5 py-3">Users</th><th className="px-5 py-3">Your role</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {memberships.map(({ company: c, role }) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="px-5 py-3.5">
                    <Link href={`/companies/${c.id}`} className="font-medium hover:text-brand-700">{c.name}</Link>
                    {c.id === current.id && <span className="ml-2"><Badge tone="brand">Current</Badge></span>}
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{c._count.owners}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{c._count.memberships}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{role === "ADMIN" ? "Admin" : "Member"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {isAdmin && (
          <Card className="h-fit p-6">
            <h2 className="mb-1 text-base font-semibold">New company</h2>
            <p className="mb-5 text-sm text-ink-soft">You&apos;ll be its administrator, then you can set up its KPIs.</p>
            <ActionForm action={createCompany} submit="Create company">
              <Field label="Company name"><Input name="name" placeholder="e.g. Northwind Ltd." required /></Field>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" name="switch" defaultChecked className="accent-brand-600" /> Switch to this company
              </label>
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  );
}
