import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AccountLayout } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Your account",
  description: "Your Housing Agent profile, shortlist, listings and enquiries.",
};

export default function AccountPage() {
  return (
    <RequireAuth
      title="Sign in to see your account"
      description="Your profile, shortlist, listings and enquiries live behind your account."
    >
      <AccountLayout
        title="Your account"
        description="An overview of your shortlist, listings and messages."
      >
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-card bg-surface-2" />}
        >
          <AccountDashboard />
        </Suspense>
      </AccountLayout>
    </RequireAuth>
  );
}
