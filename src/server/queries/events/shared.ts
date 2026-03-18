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

export const publicEventSelect = Prisma.validator<Prisma.EventSelect>()({
  id: true,
  slug: true,
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
  city: {
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
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

export type PublicEventRecordWithAi = Prisma.EventGetPayload<{
  select: typeof publicEventSelectWithAi;
}>;
