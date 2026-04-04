import { Prisma } from "@prisma/client";

export const publicPlaceVisibilityWhere =
  Prisma.validator<Prisma.PlaceWhereInput>()({
    isPublished: true,
    moderationStatus: "APPROVED",
    OR: [
      { aiReviewStatus: null },
      {
        aiReviewStatus: {
          not: "REJECT",
        },
      },
    ],
  });

export function buildPublicPlaceWhere(
  where: Prisma.PlaceWhereInput = {},
): Prisma.PlaceWhereInput {
  return {
    AND: [publicPlaceVisibilityWhere, where],
  };
}

export const publicMediaAssetSelect = Prisma.validator<Prisma.MediaAssetSelect>()({
  id: true,
  assetUrl: true,
  sourceProvider: true,
  sourceUrl: true,
  externalRef: true,
  role: true,
  status: true,
  rightsStatus: true,
  attributionText: true,
  attributionUrl: true,
  altText: true,
  sortOrder: true,
  observedAt: true,
});

/**
 * Öffentliche Medien für Listen/Detail (ohne Google): Google-Cover läuft nur über
 * `place_rating_sources.external_ref` + `/api/google-photo?placeId=` — keine Sonderrolle für Google-`media_assets`.
 */
export const publicPlaceMediaAssetVisibilityWhere =
  Prisma.validator<Prisma.MediaAssetWhereInput>()({
    NOT: { sourceProvider: "GOOGLE" },
    OR: [
      { status: "ACTIVE" },
      {
        status: "PENDING_REVIEW",
        rightsStatus: "DISPLAY_ALLOWED",
      },
    ],
  });

export const publicPlaceRatingSourceSelect =
  Prisma.validator<Prisma.PlaceRatingSourceSelect>()({
    id: true,
    provider: true,
    sourceUrl: true,
    externalRef: true,
    status: true,
    ratingValue: true,
    ratingCount: true,
    scaleMax: true,
    isIncludedInDisplay: true,
    observedAt: true,
    attributionText: true,
    attributionUrl: true,
    reviewTextRightsStatus: true,
  });

export type PublicPlaceRatingSourceRow = Prisma.PlaceRatingSourceGetPayload<{
  select: typeof publicPlaceRatingSourceSelect;
}>;

/** JSON/Client-sichere Zahlen; gleiche Form wie nach `publicPlaceRecordForFlight`. */
export function normalizePlaceRatingSourcesForClient(
  sources: PublicPlaceRatingSourceRow[] | undefined,
): PublicPlaceRatingSourceRow[] | undefined {
  if (!sources?.length) {
    return sources;
  }
  return sources.map((source) => ({
    ...source,
    ratingValue: source.ratingValue != null ? Number(source.ratingValue) : source.ratingValue,
    scaleMax: source.scaleMax != null ? Number(source.scaleMax) : source.scaleMax,
  })) as unknown as PublicPlaceRatingSourceRow[];
}

export const publicPlaceSelect = Prisma.validator<Prisma.PlaceSelect>()({
  id: true,
  slug: true,
  isPublished: true,
  moderationStatus: true,
  name: true,
  descriptionDe: true,
  descriptionTr: true,
  addressLine1: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  phone: true,
  websiteUrl: true,
  openingHoursJson: true,
  images: true,
  primaryImageAssetId: true,
  fallbackImageAssetId: true,
  imageSetStatus: true,
  displayRatingValue: true,
  displayRatingCount: true,
  ratingSourceCount: true,
  ratingSummaryUpdatedAt: true,
  /**
   * ACTIVE-Zeilen mit ratingCount > 0: `provider` bzw. `attributionText` erscheinen in der
   * Quellenzeile (Karten, Listen, Ort-Detail), sobald die Zeilen in der DB existieren.
   */
  placeRatingSources: {
    where: { status: "ACTIVE" },
    orderBy: [{ observedAt: "desc" }, { createdAt: "desc" }],
    select: publicPlaceRatingSourceSelect,
  },
  primaryImageAsset: {
    select: publicMediaAssetSelect,
  },
  fallbackImageAsset: {
    select: publicMediaAssetSelect,
  },
  verificationStatus: true,
  city: {
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  },
  category: {
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
      icon: true,
    },
  },
});

export const publicPlaceDetailSelect = Prisma.validator<Prisma.PlaceSelect>()({
  ...publicPlaceSelect,
  mediaAssets: {
    where: publicPlaceMediaAssetVisibilityWhere,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: publicMediaAssetSelect,
  },
  placeRatingSources: {
    where: { status: "ACTIVE" },
    orderBy: [{ observedAt: "desc" }, { createdAt: "desc" }],
    select: publicPlaceRatingSourceSelect,
  },
});

export const publicPlaceSelectWithAi = Prisma.validator<Prisma.PlaceSelect>()({
  ...publicPlaceSelect,
  aiReviewStatus: true,
  aiConfidenceScore: true,
  createdAt: true,
  mediaAssets: {
    where: publicPlaceMediaAssetVisibilityWhere,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    /** Mehr als ein Eintrag: erstes nach sortOrder kann z. B. ohne gültiges Google-`external_ref` sein. */
    take: 16,
    select: publicMediaAssetSelect,
  },
});

/**
 * Discovery-Karte / JSON-Pins: gleiche öffentlichen Felder wie `publicPlaceSelect`, aber **ohne**
 * `placeRatingSources`. Bei Hunderten Markern explodiert sonst RSC/JSON (Netlify ~6MB, Timeouts).
 */
export const publicPlaceSelectDiscoveryMap = Prisma.validator<Prisma.PlaceSelect>()({
  id: true,
  slug: true,
  isPublished: true,
  moderationStatus: true,
  name: true,
  descriptionDe: true,
  descriptionTr: true,
  addressLine1: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  phone: true,
  websiteUrl: true,
  openingHoursJson: true,
  images: true,
  primaryImageAssetId: true,
  fallbackImageAssetId: true,
  imageSetStatus: true,
  displayRatingValue: true,
  displayRatingCount: true,
  ratingSourceCount: true,
  ratingSummaryUpdatedAt: true,
  primaryImageAsset: {
    select: publicMediaAssetSelect,
  },
  fallbackImageAsset: {
    select: publicMediaAssetSelect,
  },
  verificationStatus: true,
  city: {
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  },
  category: {
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
      icon: true,
    },
  },
});

export const publicPlaceSelectWithAiDiscoveryMap = Prisma.validator<Prisma.PlaceSelect>()({
  ...publicPlaceSelectDiscoveryMap,
  aiReviewStatus: true,
  aiConfidenceScore: true,
  createdAt: true,
});

/**
 * Minimaler Select nur für City-Map-Pins/API.
 * Kein Telefon, keine Website, keine Medien-/Image-Felder, keine Hours.
 */
export const publicPlaceSelectWithAiMapPin = Prisma.validator<Prisma.PlaceSelect>()({
  id: true,
  slug: true,
  name: true,
  descriptionDe: true,
  descriptionTr: true,
  addressLine1: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  displayRatingValue: true,
  displayRatingCount: true,
  ratingSourceCount: true,
  verificationStatus: true,
  aiReviewStatus: true,
  aiConfidenceScore: true,
  createdAt: true,
  city: {
    select: {
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  },
  category: {
    select: {
      slug: true,
      nameDe: true,
      nameTr: true,
      icon: true,
    },
  },
});

export type PublicPlaceRecord = Prisma.PlaceGetPayload<{
  select: typeof publicPlaceSelect;
}>;

export type PublicPlaceDetailRecord = Prisma.PlaceGetPayload<{
  select: typeof publicPlaceDetailSelect;
}>;

export type PublicPlaceRecordWithAi = Prisma.PlaceGetPayload<{
  select: typeof publicPlaceSelectWithAi;
}>;

export type PublicPlaceRecordWithAiDiscoveryMap = Prisma.PlaceGetPayload<{
  select: typeof publicPlaceSelectWithAiDiscoveryMap;
}>;

export type PublicPlaceRecordWithAiMapPin = Prisma.PlaceGetPayload<{
  select: typeof publicPlaceSelectWithAiMapPin;
}>;

/** Strippt AI-Felder und macht `displayRatingValue` Flight-/JSON-tauglich (kein Prisma.Decimal). */
export function publicPlaceRecordForFlight(
  place: PublicPlaceRecordWithAi | PublicPlaceRecordWithAiDiscoveryMap,
  isSaved: boolean,
): PublicPlaceRecord & { isSaved: boolean } {
  const {
    aiReviewStatus: _aiReviewStatus,
    aiConfidenceScore: _aiConfidenceScore,
    createdAt: _createdAt,
    ...rest
  } = place;
  const rawSources =
    "placeRatingSources" in place ? place.placeRatingSources : undefined;
  return {
    ...rest,
    displayRatingValue:
      rest.displayRatingValue != null ? Number(rest.displayRatingValue) : null,
    placeRatingSources: normalizePlaceRatingSourcesForClient(rawSources),
    isSaved,
  } as unknown as PublicPlaceRecord & { isSaved: boolean };
}
