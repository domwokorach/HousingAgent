import type { Metadata } from "next";
import { ProfileForm } from "@/components/account/ProfileForm";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AccountLayout } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and update the details on your Housing Agent account.",
};

export default function ProfilePage() {
  return (
    <RequireAuth
      title="Sign in to see your profile"
      description="Your name, email address and phone number live behind your account."
    >
      <AccountLayout
        title="Profile"
        description="The details agents see when you send an enquiry."
      >
        <ProfileForm />
      </AccountLayout>
    </RequireAuth>
  );
}
