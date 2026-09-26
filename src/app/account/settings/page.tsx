import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AccountLayout } from "@/components/layout/Sidebar";
import { AccountSummary } from "@/components/account/AccountSummary";

export const metadata: Metadata = {
  title: "Account settings",
  description: "Change your password or permanently delete your Housing Agent account.",
};

export default function SettingsPage() {
  return (
    <RequireAuth
      title="Sign in to reach your settings"
      description="You need to be signed in to change your password or delete your account."
    >
      <AccountLayout
        title="Account settings"
        description="Manage your sign-in details and your account itself."
      >
        <div className="flex flex-col gap-6">
          <AccountSummary />
          <ChangePasswordForm />
        </div>
      </AccountLayout>
    </RequireAuth>
  );
}
