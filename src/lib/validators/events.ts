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
  categories: z.array(z.enum(eventCategories)).max(8).optional(),
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
function eventCategorySearchParamValues(
  raw: string | string[] | undefined | null,
): (typeof eventCategories)[number][] {
  if (raw == null) {
    return [];
  }
  const list = Array.isArray(raw) ? raw : [raw];
  const out: (typeof eventCategories)[number][] = [];
  for (const item of list) {
    if (typeof item !== "string") {
      continue;
    }
    const parsed = eventCategoryEnumSchema.safeParse(item.trim());
    if (parsed.success) {
      out.push(parsed.data);
    }
  }
  return [...new Set(out)];
}

export function parseEventsFiltersFromSearchParams(
  raw: Record<string, string | string[] | undefined>,
): EventsFilterInput {
  const cityResult = eventsFilterSchema.shape.city.safeParse(firstSearchParam(raw.city));
  const qResult = eventsFilterSchema.shape.q.safeParse(firstSearchParam(raw.q));

  const categoriesRaw = eventCategorySearchParamValues(raw.category);
  const categoriesResult = eventsFilterSchema.shape.categories.safeParse(
    categoriesRaw.length > 0 ? categoriesRaw : undefined,
  );
  const dateResult = eventDateFilterSchema.safeParse(firstSearchParam(raw.date));
  const sortResult = eventSortSchema.safeParse(firstSearchParam(raw.sort));

  return {
    city: cityResult.success ? cityResult.data : undefined,
    q: qResult.success ? qResult.data : undefined,
    categories: categoriesResult.success ? categoriesResult.data : undefined,
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
