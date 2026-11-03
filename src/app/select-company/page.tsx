import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { selectCompany, logout } from "../login/actions";
import { AuthShell } from "../login/AuthShell";

export default async function SelectCompanyPage() {
  const { user } = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { company: { name: "asc" } },
  });

  return (
    <AuthShell title="Select a company" subtitle={`Signed in as ${user.email}`}>
      {memberships.length === 0 ? (
        <p className="text-sm text-ink-soft">You don&apos;t have access to any companies yet. Ask an administrator to grant access.</p>
      ) : (
        <div className="space-y-2">
          {memberships.map((m) => (
            <form key={m.id} action={selectCompany}>
              <input type="hidden" name="companyId" value={m.companyId} />
              <button className="flex w-full items-center justify-between rounded-lg border border-line bg-surface px-4 py-3 text-left transition hover:border-brand-500 hover:shadow-sm">
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-50 text-sm font-semibold text-brand-700">
                    {m.company.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">{m.company.name}</span>
                </span>
                <span className="text-xs text-ink-soft">{m.role === "ADMIN" ? "Admin" : "Member"}</span>
              </button>
            </form>
          ))}
        </div>
      )}
      <form action={logout} className="mt-8">
        <button className="text-sm text-ink-soft hover:text-ink">Sign out</button>
      </form>
    </AuthShell>
  );
}
