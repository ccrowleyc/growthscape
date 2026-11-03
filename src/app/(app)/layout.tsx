import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { MobileNav, Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, company, role } = await requireCompany();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { company: true },
    orderBy: { company: { name: "asc" } },
  });
  const isAdmin = user.isAdmin || role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{ name: user.name, email: user.email }}
          company={{ id: company.id, name: company.name }}
          companies={memberships.map((m) => ({ id: m.company.id, name: m.company.name }))}
        />
        <MobileNav isAdmin={isAdmin} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
