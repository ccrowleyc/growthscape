"use client";

import { useActionState, type ReactNode } from "react";
import { Button, ErrorText } from "./ui";

export type ActionState = { error?: string; ok?: string } | undefined;

/** A form bound to a server action that returns {error|ok}. */
export function ActionForm({
  action,
  children,
  submit,
  className = "space-y-5",
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  children: ReactNode;
  submit: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      <ErrorText>{state?.error}</ErrorText>
      {state?.ok && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.ok}</p>}
      <Button disabled={pending}>{pending ? "Saving…" : submit}</Button>
    </form>
  );
}
