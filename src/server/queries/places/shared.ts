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
    where: {
      status: "ACTIVE",
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: publicMediaAssetSelect,
  },
  placeRatingSources: {
    where: {
      status: "ACTIVE",
      isIncludedInDisplay: true,
    },
    orderBy: [{ observedAt: "desc" }, { createdAt: "desc" }],
    select: publicPlaceRatingSourceSelect,
  },
});

export const publicPlaceSelectWithAi = Prisma.validator<Prisma.PlaceSelect>()({
  ...publicPlaceSelect,
  aiReviewStatus: true,
  aiConfidenceScore: true,
  createdAt: true,
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
