import { prisma } from "@/lib/prisma";
import { computeCategoryAdjustedScore, getPlaceScoreRatingCount } from "@/lib/places";
import { compareByAiRanking } from "@/server/queries/ai-shared";
import { getCategoryIdsEligibleForBrowse } from "@/server/queries/categories/category-browse-eligibility";
import type { FeedDiscoveryBundle } from "@/server/queries/discovery/get-feed-discovery";
import { listTrendingCollectionsForDiscovery } from "@/server/queries/discovery/list-trending-collections";
import { listTrendingEventsForDiscovery } from "@/server/queries/discovery/list-trending-events";
import { listTrendingPlacesForDiscovery } from "@/server/queries/discovery/list-trending-places";
import {
  buildPublicEventWhere,
  publicEventRecordForFlight,
  publicEventSelectWithAi,
  type PublicEventRecordWithAi,
} from "@/server/queries/events/shared";
import {
  buildPublicPlaceWhere,
  publicPlaceRecordForFlight,
  publicPlaceSelectWithAi,
  type PublicPlaceRecordWithAi,
} from "@/server/queries/places/shared";

const PLACES_PREVIEW = 10;
const EVENTS_PREVIEW = 10;
const COLLECTIONS_PREVIEW = 6;
/** Ranked in memory to top previews; cap limits DB/JSON work per request. */
const FETCH_PLACES_CAP = 96;
const FETCH_EVENTS_CAP = 56;
const TRENDING_LIMIT = 4;

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

function rankEventsPreview(events: PublicEventRecordWithAi[]) {
  return [...events].sort((left, right) =>
    compareByAiRanking<PublicEventRecordWithAi>(left, right, (eventLeft, eventRight) => {
      const startsAtDiff = eventLeft.startsAt.getTime() - eventRight.startsAt.getTime();
      if (startsAtDiff !== 0) {
        return startsAtDiff;
      }
      return eventRight.createdAt.getTime() - eventLeft.createdAt.getTime();
    }),
  );
}

export type CityBrowsePublicCollection = {
  id: string;
  title: string;
  description: string | null;
  itemCount: number;
};

export async function getCityBrowseData(args: {
  citySlug: string;
  locale: "de" | "tr";
  viewerUserId: string | null;
}) {
  const city = await prisma.city.findUnique({
    where: { slug: args.citySlug },
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
      isPilot: true,
    },
  });

  if (!city) {
    return null;
  }

  const now = new Date();

  const [
    placeRows,
    eventRows,
    collectionRows,
    placeCount,
    eventCount,
    trendingPlaces,
    trendingEvents,
    trendingCollections,
  ] = await Promise.all([
    prisma.place.findMany({
      where: buildPublicPlaceWhere({ cityId: city.id }),
      take: FETCH_PLACES_CAP,
      select: publicPlaceSelectWithAi,
    }),
    prisma.event.findMany({
      where: buildPublicEventWhere({
        cityId: city.id,
        startsAt: { gte: now },
      }),
      take: FETCH_EVENTS_CAP,
      select: publicEventSelectWithAi,
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    }),
    prisma.placeCollection.findMany({
      where: {
        visibility: "PUBLIC",
        items: { some: { place: { cityId: city.id } } },
      },
      orderBy: { updatedAt: "desc" },
      take: COLLECTIONS_PREVIEW,
      select: {
        id: true,
        title: true,
        description: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.place.count({
      where: buildPublicPlaceWhere({ cityId: city.id }),
    }),
    prisma.event.count({
      where: buildPublicEventWhere({
        cityId: city.id,
        startsAt: { gte: now },
      }),
    }),
    listTrendingPlacesForDiscovery({
      locale: args.locale,
      cityIds: [city.id],
      limit: TRENDING_LIMIT,
    }),
    listTrendingEventsForDiscovery({
      locale: args.locale,
      cityIds: [city.id],
      limit: TRENDING_LIMIT,
    }),
    listTrendingCollectionsForDiscovery({
      cityIds: [city.id],
      limit: TRENDING_LIMIT,
    }),
  ]);

  const rankedPlaces = rankPlacesPreview(placeRows).slice(0, PLACES_PREVIEW);
  const rankedEvents = rankEventsPreview(eventRows).slice(0, EVENTS_PREVIEW);

  const categoryIdsForEligibility =
    rankedPlaces.length > 0 ? [...new Set(rankedPlaces.map((p) => p.category.id))] : [];

  const needSaved =
    Boolean(args.viewerUserId) && (rankedPlaces.length > 0 || rankedEvents.length > 0);

  const [eligibleCategoryIdsForBrowse, savedPlaces, savedEvents] = await Promise.all([
    categoryIdsForEligibility.length > 0
      ? getCategoryIdsEligibleForBrowse(categoryIdsForEligibility)
      : Promise.resolve(new Set<string>()),
    needSaved && rankedPlaces.length > 0
      ? prisma.savedPlace.findMany({
          where: {
            userId: args.viewerUserId!,
            placeId: { in: rankedPlaces.map((p) => p.id) },
          },
          select: { placeId: true },
        })
      : Promise.resolve([]),
    needSaved && rankedEvents.length > 0
      ? prisma.savedEvent.findMany({
          where: {
            userId: args.viewerUserId!,
            eventId: { in: rankedEvents.map((e) => e.id) },
          },
          select: { eventId: true },
        })
      : Promise.resolve([]),
  ]);

  const sp = new Set(savedPlaces.map((s) => s.placeId));
  const se = new Set(savedEvents.map((s) => s.eventId));
  const placeItems = rankedPlaces.map((p) =>
    publicPlaceRecordForFlight(p, needSaved && sp.has(p.id)),
  );
  const eventItems = rankedEvents.map((e) =>
    publicEventRecordForFlight(e, needSaved && se.has(e.id)),
  );

  const discovery: FeedDiscoveryBundle = {
    places: trendingPlaces,
    events: trendingEvents,
    collections: trendingCollections,
    isLocalScope: true,
  };

  const publicCollections: CityBrowsePublicCollection[] = collectionRows.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    itemCount: c._count.items,
  }));

  return {
    city,
    places: placeItems,
    events: eventItems,
    publicCollections,
    discovery,
    placeCount,
    eventCount,
    eligibleCategoryIdsForBrowse,
  };
}
