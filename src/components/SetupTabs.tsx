"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SetupTabs({ companyId, done }: { companyId: string; done: Record<string, boolean> }) {
  const path = usePathname();
  const base = `/companies/${companyId}`;
  const tabs = [
    { href: base, label: "Overview", step: 0 },
    { href: `${base}/kpis`, label: "KPIs", step: 1 },
    { href: `${base}/data-sources`, label: "Data sources", step: 2 },
    { href: `${base}/models`, label: "Valuation models", step: 3 },
    { href: `${base}/owners`, label: "Initiative owners", step: 4 },
  ];
  return (
    <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        const active = t.step === 0 ? path === base : path.startsWith(t.href);
        const key = t.href.split("/").pop()!;
        return (
          <Link key={t.href} href={t.href} className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${active ? "border-brand-600 text-brand-700" : "border-transparent text-ink-soft hover:text-ink"}`}>
            {t.step > 0 && (
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[11px] ${done[key] ? "bg-brand-600 text-white" : "bg-muted text-ink-soft"}`}>{done[key] ? "✓" : t.step}</span>
            )}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
