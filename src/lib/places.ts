import type { Locale } from "@prisma/client";

import { getGalleryMediaAssets, resolveEntityImage, type ResolvedEntityImage } from "@/lib/media";
import {
  PLACE_CATEGORY_SEED_ROWS,
  type PlaceCategorySlug,
} from "@/lib/place-category-catalog";

type LocalizedText = {
  de?: string | null;
  tr?: string | null;
};

type OpeningHoursEntry = {
  day: string;
  open: string;
  close: string;
};

type PlaceCategoryLike = {
  slug: string;
  nameDe: string;
  nameTr: string;
};

type DecimalValue = number | string | { toString(): string };

type PlaceMediaAssetLike = {
  id?: string | null;
  assetUrl: string;
  sourceProvider?: string | null;
  sourceUrl?: string | null;
  externalRef?: string | null;
  role: string;
  status: string;
  rightsStatus: string;
  attributionText?: string | null;
  attributionUrl?: string | null;
  altText?: string | null;
  sortOrder?: number | null;
  observedAt?: Date | null;
};

type PlaceRatingSourceLike = {
  provider: string;
  sourceUrl?: string | null;
  externalRef?: string | null;
  status: string;
  ratingValue: DecimalValue;
  ratingCount: number;
  scaleMax: DecimalValue;
  isIncludedInDisplay: boolean;
  observedAt?: Date | string | null;
  attributionText?: string | null;
  attributionUrl?: string | null;
  reviewTextRightsStatus: string;
};

function normalizeSourceObservedAt(value: Date | string | null | undefined): Date | null {
  if (value == null) {
    return null;
  }
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

type PlaceImageStateLike = {
  images?: string[] | null;
  primaryImageAsset?: PlaceMediaAssetLike | null;
  fallbackImageAsset?: PlaceMediaAssetLike | null;
  mediaAssets?: PlaceMediaAssetLike[] | null;
};

type PlaceRatingSummaryLike = {
  displayRatingValue?: DecimalValue | null;
  displayRatingCount?: number | null;
  ratingSourceCount?: number | null;
  ratingSummaryUpdatedAt?: Date | null;
  placeRatingSources?: PlaceRatingSourceLike[] | null;
  legacyRatingCount?: number | null;
  legacyRatingValue?: DecimalValue | null;
};

type LatLngLike = {
  latitude: number;
  longitude: number;
};

type PlaceMapScoreLike = PlaceRatingSummaryLike & {
  latitude?: number | null;
  longitude?: number | null;
};

type PlaceCategoryScoreLike = PlaceRatingSummaryLike & {
  category?: {
    slug?: string | null;
  } | null;
};

export type ResolvedPlaceRatingSummary = {
  value: number;
  count: number;
  sourceCount: number;
  updatedAt: Date | null;
  sources: Array<{
    provider: string;
    ratingValue: number;
    ratingCount: number;
    scaleMax: number;
    attributionText: string | null;
    attributionUrl: string | null;
    observedAt: Date | null;
  }>;
};

export type RatingConfidenceLevel = "low" | "medium" | "high";

const CATEGORY_FACTORS = {
  restaurant: 1,
  cafe: 1,
  mosque: 0.6,
  shop: 0.8,
  default: 1,
} as const;

const localizedPlaceCategoryLabels = Object.fromEntries(
  PLACE_CATEGORY_SEED_ROWS.map((row) => [row.slug, { de: row.nameDe, tr: row.nameTr }]),
) as Record<PlaceCategorySlug, { de: string; tr: string }>;

const openingHoursDayLabels = {
  "Mon-Sun": { de: "Mo-So", tr: "Pzt-Paz" },
  "Tue-Sun": { de: "Di-So", tr: "Sal-Paz" },
  "Mon-Sat": { de: "Mo-Sa", tr: "Pzt-Cmt" },
  "Mon-Fri": { de: "Mo-Fr", tr: "Pzt-Cum" },
  Mon: { de: "Mo", tr: "Pzt" },
  Tue: { de: "Di", tr: "Sal" },
  Wed: { de: "Mi", tr: "Çar" },
  Thu: { de: "Do", tr: "Per" },
  Fri: { de: "Fr", tr: "Cum" },
  Sat: { de: "Sa", tr: "Cmt" },
  Sun: { de: "So", tr: "Paz" },
} satisfies Record<string, { de: string; tr: string }>;

export function getLocalizedText(
  value: LocalizedText,
  locale: Locale | "de" | "tr",
  fallback = "",
) {
  if (locale === "tr") {
    return value.tr ?? value.de ?? fallback;
  }

  return value.de ?? value.tr ?? fallback;
}

export function parseOpeningHours(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as OpeningHoursEntry[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry) =>
        typeof entry?.day === "string" &&
        typeof entry?.open === "string" &&
        typeof entry?.close === "string",
    );
  } catch {
    return [];
  }
}

export function formatOpeningHoursDay(
  day: string,
  locale: Locale | "de" | "tr",
) {
  const label = openingHoursDayLabels[day as keyof typeof openingHoursDayLabels];
  if (!label) {
    return day;
  }

  return locale === "tr" ? label.tr : label.de;
}

export function getLocalizedPlaceCategoryLabel(
  category: PlaceCategoryLike,
  locale: Locale | "de" | "tr",
) {
  const label =
    localizedPlaceCategoryLabels[
      category.slug as keyof typeof localizedPlaceCategoryLabels
    ];

  if (label) {
    return locale === "tr" ? label.tr : label.de;
  }

  return locale === "tr" ? category.nameTr : category.nameDe;
}

export function getPlaceImage(images: string[] | null | undefined) {
  return images?.[0] ?? null;
}

function toNumber(value: DecimalValue | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number(value.toString());

  return Number.isFinite(parsed) ? parsed : null;
}

function getLegacyPlaceRatingSummary(place: PlaceRatingSummaryLike) {
  const value = toNumber(place.legacyRatingValue);
  const count = place.legacyRatingCount ?? null;

  if (value === null || count === null || count <= 0) {
    return null;
  }

  return {
    count,
    value,
  };
}

function getIncludedRatingSources(place: PlaceRatingSummaryLike) {
  return (
    place.placeRatingSources?.filter(
      (source) =>
        source.status === "ACTIVE" &&
        source.isIncludedInDisplay &&
        source.ratingCount > 0,
    ) ?? []
  );
}

/**
 * Quellenzeile in UI: nutzt alle DB-Zeilen mit `status === ACTIVE` und `ratingCount > 0`.
 * Sobald du `PlaceRatingSource` anlegst/aktivierst, erscheint `provider` oder `attributionText`
 * (siehe `formatPlaceRatingSourcesAttribution`).
 */
function getActiveRatingSourcesForAttribution(place: PlaceRatingSummaryLike) {
  return (
    place.placeRatingSources?.filter(
      (source) => source.status === "ACTIVE" && source.ratingCount > 0,
    ) ?? []
  );
}

export function resolvePlaceImage(place: PlaceImageStateLike): ResolvedEntityImage | null {
  return resolveEntityImage({
    primaryImageAsset: place.primaryImageAsset,
    fallbackImageAsset: place.fallbackImageAsset,
    legacyImageUrl: getPlaceImage(place.images),
  });
}

export function getPlaceGalleryImages(place: PlaceImageStateLike) {
  return getGalleryMediaAssets({
    mediaAssets: place.mediaAssets,
    primaryImageAsset: place.primaryImageAsset,
    fallbackImageAsset: place.fallbackImageAsset,
    legacyImageUrls: place.images,
  });
}

export function getPlaceDisplayRatingSummary(
  place: PlaceRatingSummaryLike,
): ResolvedPlaceRatingSummary | null {
  const displayValue = toNumber(place.displayRatingValue);
  const displayCount = place.displayRatingCount ?? null;
  const sourceCount = place.ratingSourceCount ?? null;
  const includedSources = getIncludedRatingSources(place);
  const attributionSources = getActiveRatingSourcesForAttribution(place);

  if (
    displayValue !== null &&
    displayCount !== null &&
    displayCount > 0 &&
    sourceCount !== null &&
    sourceCount > 0
  ) {
    return {
      value: displayValue,
      count: displayCount,
      sourceCount,
      updatedAt: place.ratingSummaryUpdatedAt ?? null,
      sources: attributionSources.map((source) => ({
        provider: source.provider,
        ratingValue: toNumber(source.ratingValue) ?? 0,
        ratingCount: source.ratingCount,
        scaleMax: toNumber(source.scaleMax) ?? 5,
        attributionText: source.attributionText ?? null,
        attributionUrl: source.attributionUrl ?? null,
        observedAt: normalizeSourceObservedAt(source.observedAt),
      })),
    };
  }

  if (includedSources.length === 0) {
    return null;
  }

  const aggregateCount = includedSources.reduce((sum, source) => sum + source.ratingCount, 0);
  if (aggregateCount <= 0) {
    return null;
  }

  const weightedTotal = includedSources.reduce((sum, source) => {
    const sourceValue = toNumber(source.ratingValue);
    if (sourceValue === null) {
      return sum;
    }

    return sum + sourceValue * source.ratingCount;
  }, 0);

  const updatedAt = includedSources.reduce<Date | null>((latest, source) => {
    const d = normalizeSourceObservedAt(source.observedAt);
    if (!d) {
      return latest;
    }
    if (!latest || d > latest) {
      return d;
    }
    return latest;
  }, null);

  return {
    value: Number((weightedTotal / aggregateCount).toFixed(2)),
    count: aggregateCount,
    sourceCount: includedSources.length,
    updatedAt,
    sources: includedSources.map((source) => ({
      provider: source.provider,
      ratingValue: toNumber(source.ratingValue) ?? 0,
      ratingCount: source.ratingCount,
      scaleMax: toNumber(source.scaleMax) ?? 5,
      attributionText: source.attributionText ?? null,
      attributionUrl: source.attributionUrl ?? null,
      observedAt: normalizeSourceObservedAt(source.observedAt),
    })),
  };
}

export function hasPlaceDisplayRatingSummary(
  summary: ResolvedPlaceRatingSummary | null,
) {
  return Boolean(summary && summary.count > 0 && summary.sourceCount > 0);
}

const RATING_SOURCE_PROVIDER_LABELS: Record<string, { de: string; tr: string }> = {
  GOOGLE: { de: "Google", tr: "Google" },
  YELP: { de: "Yelp", tr: "Yelp" },
  TRIPADVISOR: { de: "Tripadvisor", tr: "Tripadvisor" },
  MERHABAMAP: { de: "MerhabaMap", tr: "MerhabaMap" },
  OTHER: { de: "Weitere Quelle", tr: "Diğer kaynak" },
};

/** Eine Zeile für Nutzer:innen: aus welchen Quellen die aggregierte Bewertung stammt. */
export function formatPlaceRatingSourcesAttribution(
  locale: "de" | "tr",
  summary: ResolvedPlaceRatingSummary | null,
): string | null {
  if (!summary?.sources?.length) {
    return null;
  }
  const lang = locale === "tr" ? "tr" : "de";
  const parts = summary.sources.map((source) => {
    const text = source.attributionText?.trim();
    if (text) {
      return text;
    }
    return RATING_SOURCE_PROVIDER_LABELS[source.provider]?.[lang] ?? source.provider;
  });
  const unique = [...new Set(parts)].filter(Boolean);
  if (unique.length === 0) {
    return null;
  }
  const list = unique.join(", ");
  return locale === "tr"
    ? `Değerlendirme kaynakları: ${list}`
    : `Bewertungen aus: ${list}`;
}

/**
 * Für Karten/Listen: benannte Quellen, sonst Fallback mit Quellenanzahl oder generischem Hinweis.
 */
export function formatPlaceRatingSourceCaption(
  locale: "de" | "tr",
  summary: ResolvedPlaceRatingSummary | null,
): string | null {
  if (!summary || summary.count <= 0) {
    return null;
  }
  const named = formatPlaceRatingSourcesAttribution(locale, summary);
  if (named) {
    return named;
  }
  if (summary.sourceCount > 0) {
    return locale === "tr"
      ? `Özet: ${summary.sourceCount} kaynaktan birleştirilmiş puan`
      : `Zusammengeführte Bewertung aus ${summary.sourceCount} Quelle(n)`;
  }
  return locale === "tr"
    ? "Kaynak: harici değerlendirme özeti"
    : "Quelle: extern zusammengeführte Bewertung";
}

export function computePlaceScore(place: PlaceRatingSummaryLike) {
  const summary = getPlaceDisplayRatingSummary(place);

  if (summary) {
    return summary.value * Math.log10(summary.count + 1);
  }

  const legacySummary = getLegacyPlaceRatingSummary(place);
  if (!legacySummary) {
    return 0;
  }

  return legacySummary.value * Math.log10(legacySummary.count + 1);
}

export function getCategoryKey(place: PlaceCategoryScoreLike) {
  const slug = place.category?.slug?.trim().toLowerCase();

  if (!slug) {
    return "default";
  }

  if (slug === "restaurants" || slug === "restaurant") {
    return "restaurant";
  }

  if (slug === "cafes" || slug === "cafe" || slug === "cafes-teahouses") {
    return "cafe";
  }

  if (slug === "mosques" || slug === "mosque" || slug === "religious-sites") {
    return "mosque";
  }

  if (
    slug === "markets" ||
    slug === "market" ||
    slug === "shop" ||
    slug === "shops" ||
    slug === "store" ||
    slug === "stores" ||
    slug === "retail"
  ) {
    return "shop";
  }

  if (slug === "gastronomy" || slug === "catering") {
    return "restaurant";
  }

  return "default";
}

export function computeCategoryAdjustedScore(place: PlaceCategoryScoreLike) {
  const baseScore = computePlaceScore(place);
  const categoryKey = getCategoryKey(place);
  const factor = CATEGORY_FACTORS[categoryKey] ?? CATEGORY_FACTORS.default;

  return baseScore / factor;
}

export function getPlaceScoreRatingCount(place: PlaceRatingSummaryLike) {
  const summary = getPlaceDisplayRatingSummary(place);
  if (summary) {
    return summary.count;
  }

  return getLegacyPlaceRatingSummary(place)?.count ?? 0;
}

export function computeRatingConfidence(place: PlaceRatingSummaryLike): {
  value: number;
  level: RatingConfidenceLevel;
} {
  const ratingCount = getPlaceScoreRatingCount(place);
  if (ratingCount <= 0) {
    return {
      value: 0,
      level: "low",
    };
  }

  const value = Math.min(1, Math.log10(ratingCount + 1) / 3);

  return {
    value,
    level: value < 0.3 ? "low" : value < 0.7 ? "medium" : "high",
  };
}

export function getTopPlaces<TPlace extends PlaceRatingSummaryLike>(
  places: readonly TPlace[],
  limit = 5,
) {
  return [...places]
    .filter((place) => {
      const summary = getPlaceDisplayRatingSummary(place);
      if (!summary || summary.count < 5) {
        return false;
      }

      return computeRatingConfidence(place).level !== "low";
    })
    .sort((left, right) => computePlaceScore(right) - computePlaceScore(left))
    .slice(0, limit);
}

export function computeDistanceKm(a: LatLngLike, b: LatLngLike) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDiff = toRadians(b.latitude - a.latitude);
  const lngDiff = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const haversine =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function computeMapScore(
  place: PlaceMapScoreLike,
  userLocation: LatLngLike | null,
) {
  const baseScore = computePlaceScore(place);

  if (
    !userLocation ||
    typeof place.latitude !== "number" ||
    typeof place.longitude !== "number"
  ) {
    return baseScore;
  }

  const distanceKm = computeDistanceKm(
    {
      latitude: place.latitude,
      longitude: place.longitude,
    },
    userLocation,
  );

  return baseScore / (1 + distanceKm * 0.5);
}

export function buildPlacesPath(
  locale: "de" | "tr",
  filters?: { city?: string; category?: string; q?: string; sort?: string; page?: number },
) {
  const search = new URLSearchParams();

  if (filters?.city) {
    search.set("city", filters.city);
  }
  if (filters?.category) {
    search.set("category", filters.category);
  }
  if (filters?.q) {
    search.set("q", filters.q);
  }
  if (filters?.sort) {
    search.set("sort", filters.sort);
  }
  if (filters?.page != null && filters.page > 1) {
    search.set("page", String(filters.page));
  }

  const query = search.toString();

  return query ? `/${locale}/places?${query}` : `/${locale}/places`;
}

/** Path for `Link` from `@/i18n/navigation` (locale prefix is added by next-intl). */
export function buildPlacesNavPath(
  locale: "de" | "tr",
  filters?: { city?: string; category?: string; q?: string; sort?: string; page?: number },
) {
  return buildPlacesPath(locale, filters).replace(new RegExp(`^/${locale}`), "");
}

export function getVerificationTone(status: string) {
  if (status === "VERIFIED") {
    return "verified";
  }

  if (status === "CLAIMED") {
    return "claimed";
  }

  return "default";
}
