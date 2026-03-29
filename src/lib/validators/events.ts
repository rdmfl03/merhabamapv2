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
  sort: z.enum(["soonest", "newest"]).optional(),
});

const eventDateFilterSchema = z.enum(["today", "this-week", "this-month", "upcoming"]);
const eventSortSchema = z.enum(["soonest", "newest"]);
const eventCategoryEnumSchema = z.enum(eventCategories);

function firstSearchParam(value: string | string[] | undefined | null): string | undefined {
  if (value == null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

/**
 * Lenient parsing: invalid enum values do not discard the whole filter set (unlike
 * `eventsFilterSchema.safeParse` on the full object).
 */
export function parseEventsFiltersFromSearchParams(
  raw: Record<string, string | string[] | undefined>,
): EventsFilterInput {
  const cityResult = eventsFilterSchema.shape.city.safeParse(firstSearchParam(raw.city));
  const qResult = eventsFilterSchema.shape.q.safeParse(firstSearchParam(raw.q));

  const categoryResult = eventCategoryEnumSchema.safeParse(firstSearchParam(raw.category));
  const dateResult = eventDateFilterSchema.safeParse(firstSearchParam(raw.date));
  const sortResult = eventSortSchema.safeParse(firstSearchParam(raw.sort));

  return {
    city: cityResult.success ? cityResult.data : undefined,
    q: qResult.success ? qResult.data : undefined,
    category: categoryResult.success ? categoryResult.data : undefined,
    date: dateResult.success ? dateResult.data : undefined,
    sort: sortResult.success ? sortResult.data : undefined,
  };
}

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
