"use client";

import { useState } from "react";
import { Field } from "./ui";

export function AccessFields({ companies, selected = [], role = "MEMBER" }: { companies: { id: string; name: string }[]; selected?: string[]; role?: string }) {
  const [all, setAll] = useState(companies.length > 0 && selected.length === companies.length);
  return (
    <>
      <Field label="Role">
        <select name="role" defaultValue={role} className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm">
          <option value="MEMBER">Member: can view and edit company data</option>
          <option value="ADMIN">Admin: can also manage users and owners</option>
        </select>
      </Field>
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium">Company access</legend>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="all" checked={all} onChange={(e) => setAll(e.target.checked)} className="accent-brand-600" />
          All my companies
        </label>
        <div className="space-y-1.5 border-l border-line pl-4">
          {companies.map((c) => (
            <label key={c.id} className={`flex items-center gap-2 text-sm ${all ? "text-ink-faint" : ""}`}>
              <input type="checkbox" name="companyIds" value={c.id} defaultChecked={selected.includes(c.id)} disabled={all} className="accent-brand-600" />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
