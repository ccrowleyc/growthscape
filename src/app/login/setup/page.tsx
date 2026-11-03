import { redirect } from "next/navigation";
import { AuthShell } from "../AuthShell";
import { SetupForm } from "./SetupForm";

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  if (!email) redirect("/login");
  return (
    <AuthShell title="Set your password" subtitle="This is your first sign-in. Choose a password for your account.">
      <SetupForm email={email} />
    </AuthShell>
  );
}
