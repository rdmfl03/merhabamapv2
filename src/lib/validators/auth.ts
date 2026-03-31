import { z } from "zod";

import { routing } from "@/i18n/routing";

const trimmedOptionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const nextValue = typeof value === "string" ? value.trim() : "";
    return nextValue.length > 0 ? nextValue : undefined;
  });

export const passwordSchema = z
  .string()
  .min(10)
  .max(128)
  .regex(/[A-Z]/, "uppercase")
  .regex(/[a-z]/, "lowercase")
  .regex(/[0-9]/, "number");

export const registrationSchema = z
  .object({
    locale: z.enum(routing.locales),
    name: trimmedOptionalString.pipe(z.string().max(120).optional()),
    email: z.string().trim().email().max(320),
    password: passwordSchema,
    confirmPassword: z.string().min(10).max(128),
    inviteCode: trimmedOptionalString.pipe(z.string().max(64).optional()),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "password_mismatch",
    path: ["confirmPassword"],
  });

export const requestPasswordResetSchema = z.object({
  locale: z.enum(routing.locales),
  email: z.string().trim().email().max(320),
});

export const requestEmailVerificationSchema = z.object({
  locale: z.enum(routing.locales),
  email: z.string().trim().email().max(320),
});

export const resetPasswordSchema = z
  .object({
    locale: z.enum(routing.locales),
    token: z.string().min(32).max(256),
    password: passwordSchema,
    confirmPassword: z.string().min(10).max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "password_mismatch",
    path: ["confirmPassword"],
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;
