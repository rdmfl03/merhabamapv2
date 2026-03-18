import { z } from "zod";

import { routing } from "@/i18n/routing";

const trimmedOptionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const nextValue = typeof value === "string" ? value.trim() : "";
    return nextValue.length > 0 ? nextValue : undefined;
  });

export const placesFilterSchema = z.object({
  city: trimmedOptionalString.pipe(z.string().max(64).optional()),
  category: trimmedOptionalString.pipe(z.string().max(64).optional()),
  q: trimmedOptionalString.pipe(z.string().max(100).optional()),
  sort: z.enum(["recommended", "newest"]).optional(),
});

export const savePlaceSchema = z.object({
  locale: z.enum(routing.locales),
  placeId: z.string().cuid(),
  returnPath: z.string().min(1).max(300),
});

export const placeReportSchema = z.object({
  locale: z.enum(routing.locales),
  placeId: z.string().cuid(),
  returnPath: z.string().min(1).max(300),
  reason: z.enum([
    "INACCURATE_INFORMATION",
    "DUPLICATE",
    "CLOSED_OR_UNAVAILABLE",
    "INAPPROPRIATE_CONTENT",
    "SPAM_OR_ABUSE",
    "OTHER",
  ]),
  details: trimmedOptionalString.pipe(z.string().max(1000).optional()),
});

export const placeClaimSchema = z.object({
  locale: z.enum(routing.locales),
  placeId: z.string().cuid(),
  returnPath: z.string().min(1).max(300),
  claimantName: z.string().trim().min(2).max(120),
  claimantEmail: z.string().trim().email().max(180),
  claimantPhone: trimmedOptionalString.pipe(z.string().max(40).optional()),
  message: trimmedOptionalString.pipe(z.string().max(1200).optional()),
  evidenceNotes: trimmedOptionalString.pipe(z.string().max(1000).optional()),
});

export type PlacesFilterInput = z.infer<typeof placesFilterSchema>;
export type SavePlaceInput = z.infer<typeof savePlaceSchema>;
export type PlaceReportInput = z.infer<typeof placeReportSchema>;
export type PlaceClaimInput = z.infer<typeof placeClaimSchema>;
