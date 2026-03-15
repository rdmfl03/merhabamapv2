import { z } from "zod";

import { routing } from "@/i18n/routing";

const openingHoursEntrySchema = z.object({
  day: z.string().min(1).max(32),
  open: z.string().min(1).max(16),
  close: z.string().min(1).max(16),
});

const openingHoursStringSchema = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const normalized = typeof value === "string" ? value.trim() : "";

    if (!normalized) {
      return undefined;
    }

    const parsed = JSON.parse(normalized) as unknown;
    return openingHoursEntrySchema.array().parse(parsed);
  });

const trimmedOptionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const normalized = typeof value === "string" ? value.trim() : "";
    return normalized.length > 0 ? normalized : undefined;
  });

export const businessPlaceUpdateSchema = z.object({
  locale: z.enum(routing.locales),
  placeId: z.string().cuid(),
  phone: trimmedOptionalString.pipe(z.string().max(64).optional()),
  websiteUrl: trimmedOptionalString.pipe(z.string().url().max(500).optional()),
  descriptionDe: trimmedOptionalString.pipe(z.string().max(5000).optional()),
  descriptionTr: trimmedOptionalString.pipe(z.string().max(5000).optional()),
  openingHoursJson: openingHoursStringSchema.optional(),
});

export type BusinessPlaceUpdateInput = z.infer<typeof businessPlaceUpdateSchema>;
