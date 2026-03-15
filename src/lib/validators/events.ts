import { z } from "zod";

import { routing } from "@/i18n/routing";

const eventCategories = [
  "CONCERT",
  "CULTURE",
  "STUDENT",
  "COMMUNITY",
  "FAMILY",
  "BUSINESS",
  "RELIGIOUS",
] as const;

const trimmedOptionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const nextValue = typeof value === "string" ? value.trim() : "";
    return nextValue.length > 0 ? nextValue : undefined;
  });

export const eventsFilterSchema = z.object({
  city: trimmedOptionalString.pipe(z.string().max(64).optional()),
  category: z.enum(eventCategories).optional(),
  date: z
    .enum(["today", "this-week", "this-month", "upcoming"])
    .optional(),
  q: trimmedOptionalString.pipe(z.string().max(100).optional()),
});

export const saveEventSchema = z.object({
  locale: z.enum(routing.locales),
  eventId: z.string().cuid(),
  returnPath: z.string().min(1).max(300),
});

export const eventReportSchema = z.object({
  locale: z.enum(routing.locales),
  eventId: z.string().cuid(),
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

export type EventsFilterInput = z.infer<typeof eventsFilterSchema>;
