import type { Metadata } from "next";
import { Suspense } from "react";
import { MyPropertiesPanel } from "@/components/account/MyPropertiesPanel";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AccountLayout } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "My properties",
  description: "Create and manage your property listings and their photos.",
};

export default function MyPropertiesPage() {
  return (
    <RequireAuth
      title="Sign in to manage your properties"
      description="Landlords, sellers and housing agents can list properties and manage their photos here."
    >
      <AccountLayout
        title="My properties"
        description="Create listings, edit their details, and manage their photos."
      >
        <Suspense
          fallback={<div className="h-64 animate-pulse rounded-card bg-surface-2" />}
        >
          <MyPropertiesPanel />
        </Suspense>
      </AccountLayout>
    </RequireAuth>
  );
}
