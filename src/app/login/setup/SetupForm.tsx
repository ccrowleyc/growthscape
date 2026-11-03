"use client";

import { useActionState } from "react";
import { Button, ErrorText, Field, Input } from "@/components/ui";
import { setupPassword } from "../actions";

export function SetupForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(setupPassword, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="email" value={email} />
      <Field label="Email"><Input value={email} disabled /></Field>
      <Field label="New password" hint="At least 10 characters.">
        <Input name="password" type="password" autoComplete="new-password" required autoFocus />
      </Field>
      <Field label="Confirm password">
        <Input name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <ErrorText>{state?.error}</ErrorText>
      <Button className="w-full" disabled={pending}>{pending ? "Saving…" : "Set password and continue"}</Button>
    </form>
  );
}
