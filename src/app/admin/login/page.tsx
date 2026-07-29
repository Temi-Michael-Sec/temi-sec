import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth/require-admin";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // A genuinely-authenticated admin skips the form. This is the secure check
  // (verifies + DB), so an invalid cookie simply stays here — no redirect loop.
  if (await getAdmin()) redirect("/admin");

  return (
    <div className="mx-auto max-w-sm py-16">
      <p className="font-mono text-sm text-faint">
        <span className="text-accent">temi@sec</span>
        <span className="text-muted">:~</span>
        <span className="text-faint">$</span> sudo -i
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em]">
        Authenticate
      </h1>
      <p className="mt-2 text-sm text-muted">Admin access only.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
