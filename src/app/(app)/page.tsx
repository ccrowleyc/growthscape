import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

export default async function Overview() {
  const { user, company } = await requireCompany();
  const [owners, models, valuations] = await Promise.all([
    db.owner.count({ where: { companyId: company.id } }),
    db.valuationModel.count({ where: { companyId: company.id } }),
    db.valuation.groupBy({ by: ["kind"], where: { companyId: company.id }, _count: true }),
  ]);
  const hasCurrent = valuations.some((v) => v.kind === "CURRENT");
  const hasTarget = valuations.some((v) => v.kind === "TARGET");
  const first = user.name.split(" ")[0];

  const steps = [
    { href: `/companies/${company.id}`, title: "Set up initiative owners", body: `${owners} owner${owners === 1 ? "" : "s"} for ${company.name}`, done: owners > 0 },
    { href: "/assessments", title: "Run an assessment", body: "Pick KPIs across the eight pillars", done: false },
    { href: "/valuation-models", title: "Build a valuation model", body: models ? `${models} model${models === 1 ? "" : "s"} defined` : "Turn KPIs into a valuation formula", done: models > 0 },
    { href: "/valuations", title: "Create current and target valuations", body: hasCurrent && hasTarget ? "Both in place" : "Then plan how to close the gap", done: hasCurrent && hasTarget },
  ];

  return (
    <>
      <PageHeader title={`Good to see you, ${first}`} description={`You're working in ${company.name.replace(/\.$/, "")}.`} />
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map((s, i) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full p-5 transition hover:border-brand-500 hover:shadow-sm">
              <div className="flex items-start gap-3">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${s.done ? "bg-brand-600 text-white" : "bg-muted text-ink-soft"}`}>
                  {s.done ? "✓" : i + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-ink-soft">{s.body}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
