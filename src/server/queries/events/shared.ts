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

export type PublicEventRecord = Prisma.EventGetPayload<{
  select: typeof publicEventSelect;
}>;

export type PublicEventDetailRecord = Prisma.EventGetPayload<{
  select: typeof publicEventDetailSelect;
}>;

export type PublicEventRecordWithAi = Prisma.EventGetPayload<{
  select: typeof publicEventSelectWithAi;
}>;
