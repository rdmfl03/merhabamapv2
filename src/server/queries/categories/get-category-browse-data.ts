import { MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE } from "@/lib/categories/public-category-browse";
import { prisma } from "@/lib/prisma";
import { computeCategoryAdjustedScore, getPlaceScoreRatingCount } from "@/lib/places";
import { compareByAiRanking } from "@/server/queries/ai-shared";
import type { FeedDiscoveryBundle } from "@/server/queries/discovery/get-feed-discovery";
import { listTrendingPlacesForDiscovery } from "@/server/queries/discovery/list-trending-places";
import {
  buildPublicPlaceWhere,
  publicPlaceRecordForFlight,
  publicPlaceSelectWithAi,
  type PublicPlaceRecordWithAi,
} from "@/server/queries/places/shared";

const PLACES_PREVIEW = 10;
const FETCH_PLACES_CAP = 96;
const TRENDING_LIMIT = 4;
const CITY_HINTS_MAX = 8;

function rankPlacesPreview(places: PublicPlaceRecordWithAi[]) {
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

export type CategoryBrowseCityHint = {
  city: {
    slug: string;
    nameDe: string;
    nameTr: string;
  };
  placeCount: number;
};

export async function getCategoryBrowseData(args: {
  categorySlug: string;
  locale: "de" | "tr";
  viewerUserId: string | null;
}) {
  const category = await prisma.placeCategory.findUnique({
    where: { slug: args.categorySlug },
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  });

  if (!category) {
    return null;
  }

  const placeCount = await prisma.place.count({
    where: buildPublicPlaceWhere({ categoryId: category.id }),
  });

  if (placeCount < MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE) {
    return null;
  }

  const [placeRows, cityGroups, trendingPlaces] = await Promise.all([
    prisma.place.findMany({
      where: buildPublicPlaceWhere({ categoryId: category.id }),
      take: FETCH_PLACES_CAP,
      select: publicPlaceSelectWithAi,
    }),
    prisma.place.groupBy({
      by: ["cityId"],
      where: buildPublicPlaceWhere({ categoryId: category.id }),
      _count: { _all: true },
    }),
    listTrendingPlacesForDiscovery({
      locale: args.locale,
      categoryId: category.id,
      limit: TRENDING_LIMIT,
    }),
  ]);

  const rankedPlaces = rankPlacesPreview(placeRows).slice(0, PLACES_PREVIEW);

  const sortedCityGroups = [...cityGroups].sort(
    (a, b) => b._count._all - a._count._all,
  );
  const cityIdsHint = sortedCityGroups.slice(0, CITY_HINTS_MAX).map((g) => g.cityId);

  const needSaved = Boolean(args.viewerUserId) && rankedPlaces.length > 0;

  const [cities, savedPlaces] = await Promise.all([
    cityIdsHint.length > 0
      ? prisma.city.findMany({
          where: { id: { in: cityIdsHint } },
          select: { id: true, slug: true, nameDe: true, nameTr: true },
        })
      : Promise.resolve([]),
    needSaved
      ? prisma.savedPlace.findMany({
          where: {
            userId: args.viewerUserId!,
            placeId: { in: rankedPlaces.map((p) => p.id) },
          },
          select: { placeId: true },
        })
      : Promise.resolve([]),
  ]);

  const cityById = new Map(cities.map((c) => [c.id, c]));
  const cityHints: CategoryBrowseCityHint[] = [];
  for (const g of sortedCityGroups.slice(0, CITY_HINTS_MAX)) {
    const row = cityById.get(g.cityId);
    if (!row) {
      continue;
    }
    cityHints.push({
      city: { slug: row.slug, nameDe: row.nameDe, nameTr: row.nameTr },
      placeCount: g._count._all,
    });
  }

  const sp = new Set(savedPlaces.map((s) => s.placeId));
  const placeItems = rankedPlaces.map((p) =>
    publicPlaceRecordForFlight(p, needSaved && sp.has(p.id)),
  );

  const discovery: FeedDiscoveryBundle = {
    places: trendingPlaces,
    events: [],
    collections: [],
    isLocalScope: false,
    isCategoryScope: true,
  };

  return {
    category,
    places: placeItems,
    placeCount,
    cityHints,
    discovery,
  };
}
