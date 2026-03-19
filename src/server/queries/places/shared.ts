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

export const publicPlaceSelectWithAi = Prisma.validator<Prisma.PlaceSelect>()({
  ...publicPlaceSelect,
  aiReviewStatus: true,
  aiConfidenceScore: true,
  createdAt: true,
});

export type PublicPlaceRecord = Prisma.PlaceGetPayload<{
  select: typeof publicPlaceSelect;
}>;

export type PublicPlaceRecordWithAi = Prisma.PlaceGetPayload<{
  select: typeof publicPlaceSelectWithAi;
}>;
