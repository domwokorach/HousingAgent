import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Housing Agent account.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you don't use anywhere else."
    >
      <Suspense fallback={<div className="h-80 animate-pulse rounded-card bg-surface-2" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
