import type { Prisma } from "@prisma/client";

import type { PlacesFilterInput } from "@/lib/validators/places";
import { prisma } from "@/lib/prisma";
import { compareByAiRanking } from "@/server/queries/ai-shared";

import {
  buildPublicPlaceWhere,
  publicPlaceSelectWithAi,
  type PublicPlaceRecord,
  type PublicPlaceRecordWithAi,
} from "./shared";

export type ListedPlace = PublicPlaceRecord & {
  isSaved: boolean;
};

function rankPlaces(places: PublicPlaceRecordWithAi[]) {
  return [...places].sort((left, right) =>
    compareByAiRanking<PublicPlaceRecordWithAi>(left, right, (placeLeft, placeRight) => {
      const verificationStatusDiff = placeLeft.verificationStatus.localeCompare(
        placeRight.verificationStatus,
      );

      if (verificationStatusDiff !== 0) {
        return -verificationStatusDiff;
      }

      return placeRight.createdAt.getTime() - placeLeft.createdAt.getTime();
    }),
  );
}

function stripPlaceAiFields(place: PublicPlaceRecordWithAi): PublicPlaceRecord {
  const {
    aiReviewStatus: _aiReviewStatus,
    aiConfidenceScore: _aiConfidenceScore,
    createdAt: _createdAt,
    ...publicPlace
  } = place;

  return publicPlace;
}

export async function listPlaces(args: {
  filters: PlacesFilterInput;
  userId?: string;
}) {
  const where: Prisma.PlaceWhereInput = {};

  if (args.filters.city) {
    where.city = {
      slug: args.filters.city,
    };
  }

  if (args.filters.category) {
    where.category = {
      slug: args.filters.category,
    };
  }

  if (args.filters.q) {
    where.OR = [
      { name: { contains: args.filters.q, mode: "insensitive" } },
      { descriptionDe: { contains: args.filters.q, mode: "insensitive" } },
      { descriptionTr: { contains: args.filters.q, mode: "insensitive" } },
      { addressLine1: { contains: args.filters.q, mode: "insensitive" } },
    ];
  }

  const sort = args.filters.sort ?? "recommended";

  const places = await prisma.place.findMany({
    where: buildPublicPlaceWhere(where),
    orderBy:
      sort === "newest"
        ? [{ createdAt: "desc" }]
        : [{ verificationStatus: "desc" }, { createdAt: "desc" }],
    take: 48,
    select: publicPlaceSelectWithAi,
  });

  const rankedPlaces =
    sort === "newest"
      ? [...places].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(0, 24)
      : rankPlaces(places).slice(0, 24);

  if (!args.userId || rankedPlaces.length === 0) {
    return rankedPlaces.map((place) => ({ ...stripPlaceAiFields(place), isSaved: false }));
  }

  const savedPlaces = await prisma.savedPlace.findMany({
    where: {
      userId: args.userId,
      placeId: {
        in: rankedPlaces.map((place) => place.id),
      },
    },
    select: {
      placeId: true,
    },
  });

  const savedIds = new Set(savedPlaces.map((entry) => entry.placeId));

  return rankedPlaces.map((place) => ({
    ...stripPlaceAiFields(place),
    isSaved: savedIds.has(place.id),
  }));
}
