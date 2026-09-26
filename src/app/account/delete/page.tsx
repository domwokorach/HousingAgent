import type { Metadata } from "next";
import { DeleteAccountForm } from "@/components/auth/DeleteAccountForm";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AccountLayout } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Delete account",
  description: "Permanently delete your Housing Agent account and everything on it.",
};

export default function DeleteAccountPage() {
  return (
    <RequireAuth
      title="Sign in to delete your account"
      description="You need to be signed in to delete an account."
    >
      <AccountLayout
        title="Delete account"
        description="This is permanent. Please read what it removes before you continue."
      >
        <DeleteAccountForm />
      </AccountLayout>
    </RequireAuth>
  );
}
