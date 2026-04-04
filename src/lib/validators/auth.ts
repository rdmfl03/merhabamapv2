import type { ZodIssue } from "zod";
import { z } from "zod";

import { routing } from "@/i18n/routing";

const registrationIssueFieldOrder = [
  "locale",
  "email",
  "name",
  "inviteCode",
  "password",
  "confirmPassword",
] as const;

function registrationIssueFieldRank(path: ZodIssue["path"]): number {
  const key = path[0];
  if (typeof key !== "string") {
    return 999;
  }

  const idx = registrationIssueFieldOrder.indexOf(
    key as (typeof registrationIssueFieldOrder)[number],
  );

  return idx === -1 ? 999 : idx;
}

function registrationIssueKindRank(issue: ZodIssue): number {
  switch (issue.code) {
    case "too_small":
    case "too_big":
    case "invalid_enum_value":
      return 0;
    case "invalid_string":
      return issue.validation === "email" ? 1 : 2;
    case "custom":
      return 3;
    default:
      return 4;
  }
}

/** Stable keys for `AuthActionState.message` after registration schema validation fails. */
export function mapRegistrationZodIssuesToMessage(issues: ZodIssue[]): string {
  if (issues.length === 0) {
    return "validation_error";
  }

  const sorted = [...issues].sort((a, b) => {
    const byField = registrationIssueFieldRank(a.path) - registrationIssueFieldRank(b.path);
    if (byField !== 0) {
      return byField;
    }

    return registrationIssueKindRank(a) - registrationIssueKindRank(b);
  });

  const issue = sorted[0];
  const path0 = issue.path[0];

  if (path0 === "confirmPassword") {
    if (issue.code === "custom" && issue.message === "password_mismatch") {
      return "password_mismatch";
    }

    if (issue.code === "too_small") {
      return "confirm_password_too_short";
    }

    if (issue.code === "too_big") {
      return "confirm_password_too_long";
    }
  }

  if (path0 === "password") {
    if (issue.code === "too_small") {
      return "password_too_short";
    }

    if (issue.code === "too_big") {
      return "password_too_long";
    }

    if (issue.code === "invalid_string" && issue.validation === "regex") {
      if (issue.message === "uppercase") {
        return "password_needs_uppercase";
      }

      if (issue.message === "lowercase") {
        return "password_needs_lowercase";
      }

      if (issue.message === "number") {
        return "password_needs_number";
      }
    }
  }

  if (path0 === "email") {
    if (issue.code === "too_big") {
      return "email_too_long";
    }

    return "email_invalid";
  }

  if (path0 === "name" && issue.code === "too_big") {
    return "name_too_long";
  }

  if (path0 === "inviteCode" && issue.code === "too_big") {
    return "invite_code_too_long";
  }

  return "validation_error";
}

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
    inviteCode: trimmedOptionalString.pipe(z.string().max(64).optional()),
    password: passwordSchema,
    confirmPassword: z.string().min(10).max(128),
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
