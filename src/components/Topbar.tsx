"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logout, selectCompany } from "@/app/login/actions";

type Company = { id: string; name: string };

function useOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return ref;
}

export function Topbar({ user, company, companies }: { user: { name: string; email: string }; company: Company; companies: Company[] }) {
  const path = usePathname();
  const [co, setCo] = useState(false);
  const [me, setMe] = useState(false);
  const coRef = useOutside(() => setCo(false));
  const meRef = useOutside(() => setMe(false));
  const initials = user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur md:px-8">
      <div ref={coRef} className="relative">
        <button onClick={() => setCo(!co)} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted" aria-haspopup="menu" aria-expanded={co}>
          <span className="grid h-7 w-7 place-items-center rounded bg-brand-600 text-[11px] font-semibold text-white">{company.name.slice(0, 2).toUpperCase()}</span>
          <span className="text-left">
            <span className="block text-[11px] uppercase tracking-wide text-ink-faint">Company</span>
            <span className="block text-sm font-medium leading-tight">{company.name}</span>
          </span>
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-ink-faint" fill="currentColor" aria-hidden><path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
        </button>
        {co && (
          <div className="absolute left-0 mt-2 w-64 rounded-lg border border-line bg-surface p-1.5 shadow-lg" role="menu">
            <p className="px-2.5 pb-1.5 pt-1 text-xs font-medium text-ink-faint">Switch company</p>
            {companies.map((c) => (
              <form key={c.id} action={selectCompany}>
                <input type="hidden" name="companyId" value={c.id} />
                <input type="hidden" name="next" value={path} />
                <button className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted">
                  {c.name}
                  {c.id === company.id && <span className="text-brand-600">✓</span>}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>

      <div ref={meRef} className="relative">
        <button onClick={() => setMe(!me)} className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-line" aria-haspopup="menu" aria-expanded={me}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-xs font-semibold text-white">{initials}</span>
        </button>
        {me && (
          <div className="absolute right-0 mt-2 w-60 rounded-lg border border-line bg-surface p-1.5 shadow-lg" role="menu">
            <div className="px-2.5 py-2">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-ink-soft">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <Link href="/profile" onClick={() => setMe(false)} className="block rounded-md px-2.5 py-2 text-sm hover:bg-muted">Your profile</Link>
            <form action={logout}>
              <button className="w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted">Sign out</button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
