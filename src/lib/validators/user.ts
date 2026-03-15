import { z } from "zod";

import { routing } from "@/i18n/routing";
import { interestEnum } from "@/lib/user-preferences";

const trimmedOptionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const nextValue = typeof value === "string" ? value.trim() : "";
    return nextValue.length > 0 ? nextValue : undefined;
  });

export const onboardingSchema = z.object({
  locale: z.enum(routing.locales),
  preferredLocale: z.enum(routing.locales),
  cityId: z.string().cuid(),
  interests: z.array(interestEnum).min(1).max(7),
});

export const profileUpdateSchema = z.object({
  locale: z.enum(routing.locales),
  name: trimmedOptionalString.pipe(z.string().max(120).optional()),
  username: trimmedOptionalString.pipe(
    z
      .string()
      .min(3)
      .max(32)
      .regex(/^[a-z0-9_]+$/i)
      .optional(),
  ),
  preferredLocale: z.enum(routing.locales),
  cityId: z.string().cuid(),
  interests: z.array(interestEnum).min(1).max(7),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
