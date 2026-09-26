import type { AccountType } from "@/types/user";
import type { Specialisation } from "@/types/agent";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  tenant: "Tenant / Buyer",
  landlord: "Landlord / Seller",
  agent: "Housing Agent",
};

export const ACCOUNT_TYPES: Array<{
  value: AccountType;
  label: string;
  description: string;
}> = [
  {
    value: "tenant",
    label: ACCOUNT_TYPE_LABELS.tenant,
    description: "Search, shortlist and enquire about homes.",
  },
  {
    value: "landlord",
    label: ACCOUNT_TYPE_LABELS.landlord,
    description: "List your own property and manage its photos.",
  },
  {
    value: "agent",
    label: ACCOUNT_TYPE_LABELS.agent,
    description: "Manage a portfolio and respond to enquiries.",
  },
];

/** Account types allowed to advertise a property. */
export const LISTING_ACCOUNT_TYPES: AccountType[] = ["landlord", "agent"];

export function canListProperties(accountType: AccountType): boolean {
  return LISTING_ACCOUNT_TYPES.includes(accountType);
}

export const SPECIALISATION_LABELS: Record<Specialisation, string> = {
  lettings: "Lettings",
  sales: "Sales",
  "new-builds": "New builds",
  student: "Student lets",
  luxury: "Luxury homes",
  commercial: "Commercial",
};

export const SPECIALISATIONS = Object.keys(SPECIALISATION_LABELS) as Specialisation[];
