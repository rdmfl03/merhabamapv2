import type { Locale } from "@prisma/client";

import { getGalleryMediaAssets, resolveEntityImage, type ResolvedEntityImage } from "@/lib/media";

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
  observedAt?: Date | null;
  attributionText?: string | null;
  attributionUrl?: string | null;
  reviewTextRightsStatus: string;
};

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

const localizedPlaceCategoryLabels = {
  restaurants: { de: "Restaurants", tr: "Restoranlar" },
  cafes: { de: "Cafes", tr: "Kafeler" },
  bakeries: { de: "Bäckereien", tr: "Fırınlar" },
  markets: { de: "Supermärkte", tr: "Marketler" },
  mosques: { de: "Moscheen", tr: "Camiler" },
  barbers: { de: "Barbiere", tr: "Berberler" },
  "travel-agencies": { de: "Reisebüros", tr: "Seyahat acenteleri" },
  services: { de: "Dienstleistungen", tr: "Hizmetler" },
} satisfies Record<string, { de: string; tr: string }>;

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
      sources: includedSources.map((source) => ({
        provider: source.provider,
        ratingValue: toNumber(source.ratingValue) ?? 0,
        ratingCount: source.ratingCount,
        scaleMax: toNumber(source.scaleMax) ?? 5,
        attributionText: source.attributionText ?? null,
        attributionUrl: source.attributionUrl ?? null,
        observedAt: source.observedAt ?? null,
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
    if (!source.observedAt) {
      return latest;
    }

    if (!latest || source.observedAt > latest) {
      return source.observedAt;
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
      observedAt: source.observedAt ?? null,
    })),
  };
}

export function hasPlaceDisplayRatingSummary(
  summary: ResolvedPlaceRatingSummary | null,
) {
  return Boolean(summary && summary.count > 0 && summary.sourceCount > 0);
}

export function buildPlacesPath(
  locale: "de" | "tr",
  filters?: { city?: string; category?: string; q?: string; sort?: string },
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

  const query = search.toString();

  return query ? `/${locale}/places?${query}` : `/${locale}/places`;
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
