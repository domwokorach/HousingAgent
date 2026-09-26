import { z } from "zod";
import { SPECIALISATIONS } from "@/constants/accountTypes";
import type { Specialisation } from "@/types/agent";
import { emailSchema, optionalPhoneSchema } from "./auth.schema";

const specialisationValues = SPECIALISATIONS as [Specialisation, ...Specialisation[]];

export const agentSearchSchema = z.object({
  query: z.string().trim().max(80, "That search is too long."),
  location: z.string().trim().max(80, "That location is too long."),
  radius: z.coerce.number().positive(),
  specialisation: z.enum(specialisationValues).or(z.literal("")),
});

export type AgentSearchValues = z.infer<typeof agentSearchSchema>;

export const enquirySchema = z.object({
  name: z.string().trim().min(1, "Please tell the agent your name."),
  email: emailSchema,
  phone: optionalPhoneSchema,
  message: z
    .string()
    .trim()
    .min(10, "Please write a short message (at least 10 characters).")
    .max(2000, "Please keep your message under 2000 characters."),
  agentId: z.string().min(1),
  propertyId: z.string().optional(),
});

export type EnquiryValues = z.infer<typeof enquirySchema>;
