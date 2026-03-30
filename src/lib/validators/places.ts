import { z } from "zod";

import { routing } from "@/i18n/routing";

const trimmedOptionalString = z
  .union([z.string(), z.undefined(), z.null()])
  .transform((value) => {
    const nextValue = typeof value === "string" ? value.trim() : "";
    return nextValue.length > 0 ? nextValue : undefined;
  });

const pageParamSchema = z.coerce.number().int().min(1).max(500);

const categorySlugParam = z.string().trim().min(1).max(64);

export const placesFilterSchema = z.object({
  city: trimmedOptionalString.pipe(z.string().max(64).optional()),
  categories: z.array(categorySlugParam).max(24).optional(),
  q: trimmedOptionalString.pipe(z.string().max(100).optional()),
  sort: z.enum(["recommended", "newest"]).optional(),
  page: pageParamSchema.optional(),
});

export type PlacesFilterInput = z.infer<typeof placesFilterSchema>;

const placeSortSchema = z.enum(["recommended", "newest"]);

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

function categorySearchParamValues(raw: string | string[] | undefined | null): string[] {
  if (raw == null) {
    return [];
  }
  const list = Array.isArray(raw) ? raw : [raw];
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") {
      continue;
    }
    const parsed = categorySlugParam.safeParse(item);
    if (parsed.success) {
      out.push(parsed.data);
    }
  }
  return [...new Set(out)];
}

/**
 * Lenient parsing: invalid enum values do not discard the whole filter set, and
 * Next.js may pass `string[]` for repeated query keys — we use the first value.
 */
export function parsePlacesFiltersFromSearchParams(
  raw: Record<string, string | string[] | undefined>,
): PlacesFilterInput {
  const cityResult = placesFilterSchema.shape.city.safeParse(firstSearchParam(raw.city));
  const categoriesRaw = categorySearchParamValues(raw.category);
  const categoriesResult = placesFilterSchema.shape.categories.safeParse(
    categoriesRaw.length > 0 ? categoriesRaw : undefined,
  );
  const qResult = placesFilterSchema.shape.q.safeParse(firstSearchParam(raw.q));
  const sortResult = placeSortSchema.safeParse(firstSearchParam(raw.sort));
  const pageResult = pageParamSchema.safeParse(firstSearchParam(raw.page));

  return {
    city: cityResult.success ? cityResult.data : undefined,
    categories: categoriesResult.success ? categoriesResult.data : undefined,
    q: qResult.success ? qResult.data : undefined,
    sort: sortResult.success ? sortResult.data : undefined,
    page: pageResult.success ? pageResult.data : undefined,
  };
}

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

export type SavePlaceInput = z.infer<typeof savePlaceSchema>;
export type PlaceReportInput = z.infer<typeof placeReportSchema>;
export type PlaceClaimInput = z.infer<typeof placeClaimSchema>;
