import type { Prisma } from "@prisma/client";

import { computeCategoryAdjustedScore, getPlaceScoreRatingCount } from "@/lib/places";
import type { PlacesFilterInput } from "@/lib/validators/places";
import { prisma } from "@/lib/prisma";
import { compareByAiRanking } from "@/server/queries/ai-shared";

import {
  buildPublicPlaceWhere,
  publicPlaceRecordForFlight,
  publicPlaceSelectWithAi,
  type PublicPlaceRecordWithAi,
} from "./shared";

export type ListedPlace = ReturnType<typeof publicPlaceRecordForFlight>;

function rankPlaces(places: PublicPlaceRecordWithAi[]) {
  return [...places].sort((left, right) =>
    compareByAiRanking<PublicPlaceRecordWithAi>(left, right, (placeLeft, placeRight) => {
      const scoreDiff =
        computeCategoryAdjustedScore(placeRight) - computeCategoryAdjustedScore(placeLeft);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      const ratingCountDiff =
        getPlaceScoreRatingCount(placeRight) - getPlaceScoreRatingCount(placeLeft);
      if (ratingCountDiff !== 0) {
        return ratingCountDiff;
      }

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

  const hasNarrowingFilter = Boolean(
    args.filters.city || args.filters.category || args.filters.q,
  );
  /** Cap in-memory ranking; raise if you add cursor pagination. */
  const dbTake = hasNarrowingFilter ? 1200 : 800;

  const places = await prisma.place.findMany({
    where: buildPublicPlaceWhere(where),
    orderBy:
      sort === "newest"
        ? [{ createdAt: "desc" }]
        : [{ verificationStatus: "desc" }, { createdAt: "desc" }],
    take: dbTake,
    select: publicPlaceSelectWithAi,
  });

  const rankedPlaces =
    sort === "newest"
      ? [...places].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      : rankPlaces(places);

  if (!args.userId || rankedPlaces.length === 0) {
    return rankedPlaces.map((place) => publicPlaceRecordForFlight(place, false));
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

  return rankedPlaces.map((place) =>
    publicPlaceRecordForFlight(place, savedIds.has(place.id)),
  );
}
