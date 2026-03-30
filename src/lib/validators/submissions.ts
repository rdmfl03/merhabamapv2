import { z } from "zod";

import { routing } from "@/i18n/routing";
import { isPilotCitySlug } from "@/lib/pilot-cities";

const trimmedString = z.string().trim();

const optionalTrimmedString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const nextValue = typeof value === "string" ? value.trim() : "";
    return nextValue.length > 0 ? nextValue : undefined;
  });

const httpUrlField = optionalTrimmedString.refine(
  (value) => {
    if (!value) {
      return true;
    }

    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "source_url_invalid" },
);

const eventCategories = [
  "CONCERT",
  "CULTURE",
  "STUDENT",
  "COMMUNITY",
  "FAMILY",
  "BUSINESS",
  "RELIGIOUS",
] as const;

export const placeSuggestionSchema = z
  .object({
    locale: z.enum(routing.locales),
    returnPath: trimmedString.min(1).max(300),
    name: trimmedString.min(2, "name_required").max(140),
    cityId: trimmedString.cuid({ message: "city_required" }),
    categoryId: trimmedString.cuid({ message: "category_required" }),
    addressLine1: optionalTrimmedString.pipe(z.string().max(180).optional()),
    sourceUrl: httpUrlField,
    description: trimmedString.min(20, "description_required").max(1200),
    note: optionalTrimmedString.pipe(z.string().max(1000).optional()),
  })
  .superRefine((value, ctx) => {
    if (!value.addressLine1 && !value.sourceUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addressLine1"],
        message: "address_or_source_required",
      });
    }
  });

export const eventSuggestionSchema = z
  .object({
    locale: z.enum(routing.locales),
    returnPath: trimmedString.min(1).max(300),
    title: trimmedString.min(2, "title_required").max(160),
    cityId: trimmedString.cuid({ message: "city_required" }),
    category: trimmedString.refine(
      (value): value is (typeof eventCategories)[number] =>
        eventCategories.includes(value as (typeof eventCategories)[number]),
      { message: "category_required" },
    ),
    date: trimmedString.regex(/^\d{4}-\d{2}-\d{2}$/, { message: "date_required" }),
    time: optionalTrimmedString.refine(
      (value) => !value || /^\d{2}:\d{2}$/.test(value),
      { message: "time_invalid" },
    ),
    venueName: optionalTrimmedString.pipe(z.string().max(160).optional()),
    addressLine1: optionalTrimmedString.pipe(z.string().max(180).optional()),
    sourceUrl: trimmedString
      .min(1, "source_url_required")
      .refine((value) => {
        try {
          const url = new URL(value);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      }, { message: "source_url_invalid" }),
    description: trimmedString.min(20, "description_required").max(1200),
    note: optionalTrimmedString.pipe(z.string().max(1000).optional()),
  })
  .superRefine((value, ctx) => {
    if (!value.venueName && !value.addressLine1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["venueName"],
        message: "venue_or_address_required",
      });
    }
  });

export const ingestEventSchema = z.object({
  title: trimmedString.min(2, "title_required").max(160),
  description: optionalTrimmedString.pipe(z.string().max(1200).optional()),
  rawText: optionalTrimmedString.pipe(z.string().max(20000).optional()),
  startsAt: optionalTrimmedString.pipe(z.string().max(120).optional()),
  rawDatetimeText: optionalTrimmedString.pipe(z.string().max(240).optional()),
  venueName: optionalTrimmedString.pipe(z.string().max(160).optional()),
  rawLocationText: optionalTrimmedString.pipe(z.string().max(240).optional()),
  citySlug: optionalTrimmedString.pipe(z.string().max(80).optional()),
  cityGuess: optionalTrimmedString.pipe(z.string().max(80).optional()),
  sourceCategory: optionalTrimmedString.pipe(z.string().max(80).optional()),
  sourceUrl: trimmedString
    .min(1, "source_url_required")
    .refine((value) => {
      try {
        const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, { message: "source_url_invalid" }),
});

export const ingestPlaceSchema = z.object({
  name: trimmedString.min(2, "name_required").max(140),
  citySlug: trimmedString.toLowerCase().refine((value) => isPilotCitySlug(value), {
    message: "city_not_allowed",
  }),
  description: optionalTrimmedString.pipe(z.string().max(1200).optional()),
  categorySlug: optionalTrimmedString.pipe(z.string().max(80).optional()),
  sourceCategory: optionalTrimmedString.pipe(z.string().max(80).optional()),
  websiteUrl: httpUrlField,
  addressLine1: optionalTrimmedString.pipe(z.string().max(180).optional()),
  postalCode: optionalTrimmedString.pipe(z.string().max(32).optional()),
  district: optionalTrimmedString.pipe(z.string().max(120).optional()),
  phone: optionalTrimmedString.pipe(z.string().max(40).optional()),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  sourceUrl: trimmedString
    .min(1, "source_url_required")
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    }, { message: "source_url_invalid" }),
});

export type PlaceSuggestionInput = z.infer<typeof placeSuggestionSchema>;
export type EventSuggestionInput = z.infer<typeof eventSuggestionSchema>;
export type IngestEventInput = z.infer<typeof ingestEventSchema>;
export type IngestPlaceInput = z.infer<typeof ingestPlaceSchema>;
