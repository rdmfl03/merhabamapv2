import { Prisma } from "@prisma/client";

export const publicEventVisibilityWhere =
  Prisma.validator<Prisma.EventWhereInput>()({
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

export function buildPublicEventWhere(
  where: Prisma.EventWhereInput = {},
): Prisma.EventWhereInput {
  return {
    AND: [publicEventVisibilityWhere, where],
  };
}

export const publicEventMediaAssetSelect = Prisma.validator<Prisma.MediaAssetSelect>()({
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

export const publicEventVenuePlaceSelect = Prisma.validator<Prisma.PlaceSelect>()({
  id: true,
  displayRatingValue: true,
  displayRatingCount: true,
  ratingSourceCount: true,
  ratingSummaryUpdatedAt: true,
});

export const publicEventSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  slug: true,
  isPublished: true,
  moderationStatus: true,
  title: true,
  descriptionDe: true,
  descriptionTr: true,
  category: true,
  venueName: true,
  addressLine1: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  startsAt: true,
  endsAt: true,
  organizerName: true,
  externalUrl: true,
  imageUrl: true,
  primaryImageAssetId: true,
  fallbackImageAssetId: true,
  imageSetStatus: true,
  venuePlaceId: true,
  primaryImageAsset: {
    select: publicEventMediaAssetSelect,
  },
  fallbackImageAsset: {
    select: publicEventMediaAssetSelect,
  },
  venuePlace: {
    select: publicEventVenuePlaceSelect,
  },
  city: {
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  },
});

export const publicEventDetailSelect = Prisma.validator<Prisma.EventSelect>()({
  ...publicEventSelect,
  mediaAssets: {
    where: {
      status: "ACTIVE",
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: publicEventMediaAssetSelect,
  },
});

export const publicEventSelectWithAi = Prisma.validator<Prisma.EventSelect>()({
  ...publicEventSelect,
  aiReviewStatus: true,
  aiConfidenceScore: true,
  createdAt: true,
});

/**
 * Minimaler Select nur für City-Map-Pins/API.
 * Keine Venue-/Image-/URL-Zusatzfelder, nur das, was Marker, Popup und Liste brauchen.
 */
export const publicEventSelectWithAiMapPin = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  slug: true,
  title: true,
  descriptionDe: true,
  descriptionTr: true,
  category: true,
  latitude: true,
  longitude: true,
  startsAt: true,
  endsAt: true,
  aiReviewStatus: true,
  aiConfidenceScore: true,
  createdAt: true,
});

export type PublicEventRecord = Prisma.EventGetPayload<{
  select: typeof publicEventSelect;
}>;

export type PublicEventDetailRecord = Prisma.EventGetPayload<{
  select: typeof publicEventDetailSelect;
}>;

export type PublicEventRecordWithAi = Prisma.EventGetPayload<{
  select: typeof publicEventSelectWithAi;
}>;

export type PublicEventRecordWithAiMapPin = Prisma.EventGetPayload<{
  select: typeof publicEventSelectWithAiMapPin;
}>;

/** Strippt AI-Felder; `venuePlace.displayRatingValue` als Zahl (kein Prisma.Decimal) für RSC/JSON. */
export function publicEventRecordForFlight(
  event: PublicEventRecordWithAi,
  isSaved: boolean,
): PublicEventRecord & { isSaved: boolean } {
  const {
    aiReviewStatus: _aiReviewStatus,
    aiConfidenceScore: _aiConfidenceScore,
    createdAt: _createdAt,
    ...rest
  } = event;
  const venuePlace = rest.venuePlace;
  return {
    ...rest,
    venuePlace: venuePlace
      ? {
          ...venuePlace,
          displayRatingValue:
            venuePlace.displayRatingValue != null
              ? Number(venuePlace.displayRatingValue)
              : null,
        }
      : null,
    isSaved,
  } as PublicEventRecord & { isSaved: boolean };
}
