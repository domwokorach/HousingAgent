export type AccountType = "tenant" | "landlord" | "agent";

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountType: AccountType;
  /** Demo-only digest. See src/lib/auth.ts — this is not real password security. */
  passwordDigest: string;
  createdAt: string;
}

export interface Session {
  email: string;
  remember: boolean;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
}

export interface Credentials {
  email: string;
  password: string;
  remember: boolean;
}

export interface Enquiry {
  id: string;
  propertyId?: string;
  agentId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  sentAt: string;
}

export type EnquiryDraft = Omit<Enquiry, "id" | "sentAt">;
