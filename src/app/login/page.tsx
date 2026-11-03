import { AuthShell } from "./AuthShell";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" subtitle="Welcome back to GrowthScape.">
      <LoginForm />
    </AuthShell>
  );
}
