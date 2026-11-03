import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
            <rect width="24" height="24" rx="6" className="fill-brand-500" />
            <path d="M5 16l4-4 3 3 6-7" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-semibold tracking-tight">GrowthScape</span>
        </div>
        <div>
          <p className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Assess performance, model valuations and plan the value you&apos;ll create.
          </p>
          <p className="mt-4 text-sm text-slate-400">Built for portfolio operators.</p>
        </div>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} GrowthScape</p>
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
