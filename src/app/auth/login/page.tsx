import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { IconKey } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Housing Agent account.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to reach your saved properties, listings and enquiries."
      aside={
        <>
          <span className="grid size-10 place-items-center rounded-control bg-cream text-ink">
            <IconKey className="size-5" />
          </span>
          <h2 className="mt-4 font-semibold text-ink">Accounts live in this browser</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            This is a demonstration app. Sign in with an account you created here — there
            is no server, so accounts don&apos;t carry across devices or browsers.
          </p>
        </>
      }
    >
      <Suspense fallback={<div className="h-80 animate-pulse rounded-card bg-surface-2" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
