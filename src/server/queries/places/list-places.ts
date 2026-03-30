import type { Prisma } from "@prisma/client";

import { computeCategoryAdjustedScore, getPlaceScoreRatingCount } from "@/lib/places";
import { isSpecificListingCity } from "@/lib/listing-city-filter";
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

export const PLACES_LIST_PAGE_SIZE = 50;

/** Upper bound for in-memory ranking; increase if you need full-catalog pagination without DB changes. */
const MAX_PLACES_RANK_BATCH = 5000;

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

      const verificationStatusDiff = (placeLeft.verificationStatus ?? "").localeCompare(
        placeRight.verificationStatus ?? "",
      );

      if (verificationStatusDiff !== 0) {
        return -verificationStatusDiff;
      }

      return placeRight.createdAt.getTime() - placeLeft.createdAt.getTime();
    }),
  );
}

export type ListPlacesResult = {
  items: ListedPlace[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

async function mapPlacesWithSaved(
  rows: PublicPlaceRecordWithAi[],
  userId: string | undefined,
): Promise<ListedPlace[]> {
  if (rows.length === 0) {
    return [];
  }

  if (!userId) {
    return rows.map((place) => publicPlaceRecordForFlight(place, false));
  }

  const savedPlaces = await prisma.savedPlace.findMany({
    where: {
      userId,
      placeId: { in: rows.map((place) => place.id) },
    },
    select: { placeId: true },
  });

  const savedIds = new Set(savedPlaces.map((entry) => entry.placeId));

  return rows.map((place) => publicPlaceRecordForFlight(place, savedIds.has(place.id)));
}

export async function listPlaces(args: {
  filters: PlacesFilterInput;
  userId?: string;
}): Promise<ListPlacesResult> {
  const where: Prisma.PlaceWhereInput = {};

  if (isSpecificListingCity(args.filters.city)) {
    where.city = {
      slug: args.filters.city,
    };
  }

  if (args.filters.categories?.length) {
    where.category = {
      slug: { in: args.filters.categories },
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
    take: MAX_PLACES_RANK_BATCH,
    select: publicPlaceSelectWithAi,
  });

  const rankedPlaces =
    sort === "newest"
      ? [...places].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      : rankPlaces(places);

  const totalCount = rankedPlaces.length;
  const pageSize = PLACES_LIST_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const requestedPage = args.filters.page ?? 1;
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  const start = (page - 1) * pageSize;
  const pageSlice = rankedPlaces.slice(start, start + pageSize);

  const items = await mapPlacesWithSaved(pageSlice, args.userId);

  return {
    items,
    totalCount,
    page,
    pageSize,
    pageCount,
  };
}
