import { z } from "zod";
import { passwordSchema, phoneSchema } from "./auth.schema";

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Enter your first name.")
    .max(60, "That name is too long."),
  lastName: z
    .string()
    .trim()
    .min(2, "Enter your last name.")
    .max(60, "That name is too long."),
  phone: phoneSchema,
});

export type ProfileValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Re-enter your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Both passwords must match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password to continue."),
});

export type DeleteAccountValues = z.infer<typeof deleteAccountSchema>;
