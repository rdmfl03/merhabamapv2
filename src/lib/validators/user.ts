import { EventCategory, ProfileVisibility } from "@prisma/client";
import { z } from "zod";

import { PLACE_CATEGORY_VISUAL_GROUP_KEY_ENUM } from "@/lib/place-category-onboarding-groups";
import { routing } from "@/i18n/routing";
import { interestEnum } from "@/lib/user-preferences";

const trimmedOptionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const nextValue = typeof value === "string" ? value.trim() : "";
    return nextValue.length > 0 ? nextValue : undefined;
  });

/** Public handle: 3–32 chars, letters, digits, underscore; stored lowercase. */
export const onboardingUsernameSchema = z
  .string()
  .trim()
  .min(3, { message: "username_invalid" })
  .max(32, { message: "username_invalid" })
  .regex(/^[a-z0-9_]+$/i, { message: "username_invalid" })
  .transform((value) => value.toLowerCase());

const MAX_ONBOARDING_PLACE_VISUAL_GROUPS = 20;

const EVENT_CATEGORY_COUNT = 7;

const placeCategoryVisualGroupSchema = z.enum(PLACE_CATEGORY_VISUAL_GROUP_KEY_ENUM);

export const onboardingBasicsSchema = z.object({
  locale: z.enum(routing.locales),
  preferredLocale: z.enum(routing.locales),
  username: onboardingUsernameSchema,
  // City PK may be cuid, uuid, etc. depending on seed/import — DB enforces existence.
  cityId: z.string().trim().min(1, { message: "city_invalid" }),
});

export const onboardingPlaceCategoriesSchema = z.object({
  locale: z.enum(routing.locales),
  placeCategoryGroups: z
    .array(placeCategoryVisualGroupSchema)
    .transform((groups) => [...new Set(groups)])
    .pipe(
      z
        .array(placeCategoryVisualGroupSchema)
        .min(1, { message: "place_categories_required" })
        .max(MAX_ONBOARDING_PLACE_VISUAL_GROUPS, { message: "place_categories_too_many" }),
    ),
});

export const onboardingEventCategoriesSchema = z.object({
  locale: z.enum(routing.locales),
  eventCategories: z
    .array(z.nativeEnum(EventCategory))
    .transform((cats) => [...new Set(cats)])
    .pipe(
      z
        .array(z.nativeEnum(EventCategory))
        .min(1, { message: "event_categories_required" })
        .max(EVENT_CATEGORY_COUNT, { message: "event_categories_too_many" }),
    ),
});

/** Full step-2+3 payload (e.g. tests). */
export const onboardingCategoriesSchema = onboardingPlaceCategoriesSchema.merge(
  onboardingEventCategoriesSchema,
);

const profileBioField = z.preprocess(
  (val) => (val === undefined || val === null ? "" : String(val)),
  z
    .string()
    .max(280)
    .transform((s) => {
      const t = s.trim();
      return t.length === 0 ? undefined : t;
    }),
);

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
  cityId: z.string().trim().min(1),
  interests: z.array(interestEnum).min(1).max(7),
  profileVisibility: z.nativeEnum(ProfileVisibility),
  bio: profileBioField,
});

export type OnboardingBasicsInput = z.infer<typeof onboardingBasicsSchema>;
export type OnboardingPlaceCategoriesInput = z.infer<typeof onboardingPlaceCategoriesSchema>;
export type OnboardingEventCategoriesInput = z.infer<typeof onboardingEventCategoriesSchema>;
export type OnboardingCategoriesInput = z.infer<typeof onboardingCategoriesSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
