import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your Housing Agent account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address you signed up with and we'll send you a link to set a new password."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
