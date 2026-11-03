import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ActionForm } from "@/components/ActionForm";
import { Badge, Card, Field, Input, PageHeader } from "@/components/ui";
import { changePassword, updateProfile } from "./actions";

export default async function ProfilePage() {
  const { user } = await requireUser();
  const memberships = await db.membership.findMany({ where: { userId: user.id }, include: { company: true }, orderBy: { company: { name: "asc" } } });

  return (
    <>
      <PageHeader title="Your profile" description="Manage your details and password." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-5 text-base font-semibold">Details</h2>
          <ActionForm action={updateProfile} submit="Save changes">
            <Field label="Name"><Input name="name" defaultValue={user.name} required /></Field>
            <Field label="Email" hint="Contact an administrator to change your email."><Input value={user.email} disabled /></Field>
          </ActionForm>
        </Card>
        <Card className="p-6">
          <h2 className="mb-5 text-base font-semibold">Password</h2>
          <ActionForm action={changePassword} submit="Change password">
            <Field label="Current password"><Input name="current" type="password" autoComplete="current-password" required /></Field>
            <Field label="New password" hint="At least 10 characters."><Input name="next" type="password" autoComplete="new-password" required /></Field>
          </ActionForm>
        </Card>
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Company access</h2>
          <div className="flex flex-wrap gap-2">
            {memberships.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm">
                {m.company.name} <Badge tone={m.role === "ADMIN" ? "brand" : "neutral"}>{m.role === "ADMIN" ? "Admin" : "Member"}</Badge>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
