"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./ui";

const ICONS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  assess: "M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9",
  model: "M4 7h16M4 12h10M4 17h6M17 14l3 3-3 3",
  value: "M12 3v18M17 7.5C17 5.6 14.8 4.5 12 4.5S7 5.6 7 7.5 9.2 10.4 12 11s5 1.6 5 3.5-2.2 3-5 3-5-1.1-5-3",
  portfolio: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  company: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M2 21h20",
  admin: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z",
};

type NavItem = { href: string; label: string; icon: string; adminOnly?: boolean; child?: boolean };

const NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: "home" },
  { href: "/assessments", label: "Assessments", icon: "assess" },
  { href: "/valuation-models", label: "Valuation Models", icon: "model" },
  { href: "/valuations", label: "Valuations", icon: "value" },
  { href: "/plans", label: "Value Creation Plans", icon: "", child: true },
  { href: "/initiatives", label: "Strategic Initiatives", icon: "", child: true },
  { href: "/portfolio", label: "Portfolio Views", icon: "portfolio" },
  { href: "/companies", label: "Companies", icon: "company" },
  { href: "/admin", label: "Administration", icon: "admin", adminOnly: true },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/"><Logo /></Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-muted hover:text-ink"
              } ${n.child ? "ml-[30px] py-1.5 text-[13px]" : ""}`}
            >
              {!n.child && <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d={ICONS[n.icon]} />
              </svg>}
              {n.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden">
      {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link key={n.href} href={n.href} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${active ? "bg-brand-50 font-medium text-brand-700" : "text-ink-soft"}`}>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
