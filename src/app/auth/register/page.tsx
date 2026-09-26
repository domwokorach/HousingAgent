import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { IconCheck } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a Housing Agent account as a tenant, buyer, landlord, seller or housing agent.",
};

const PERKS = [
  "Shortlist properties across rent and sale in one place",
  "Get your details prefilled on every enquiry",
  "List and manage your own properties and photos",
  "Delete your account and data at any time",
];

export default function RegisterPage() {
  return (
    <AuthShell
      wide
      title="Create your account"
      subtitle="It takes about a minute. Choose the account type that matches how you'll use Housing Agent."
      aside={
        <>
          <h2 className="font-semibold text-ink">What you get</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-sm text-ink-muted">
                <IconCheck className="mt-0.5 size-4 shrink-0 text-link" />
                {perk}
              </li>
            ))}
          </ul>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
