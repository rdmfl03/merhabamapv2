import { GERMANY_DISCOVERY_CENTER, resolveDiscoveryCityCenter } from "@/lib/cities/discovery-city-center";
import type { GermanyMapCluster } from "@/lib/cities/germany-map-cluster";
import { prisma } from "@/lib/prisma";
import { getGermanyMapClustersSummary } from "@/server/queries/cities/get-germany-map-clusters";
import { computeCategoryAdjustedScore, getPlaceScoreRatingCount } from "@/lib/places";
import { compareByAiRanking } from "@/server/queries/ai-shared";
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
  publicPlaceSelectWithAiDiscoveryMap,
  type PublicPlaceRecordWithAi,
  type PublicPlaceRecordWithAiDiscoveryMap,
} from "@/server/queries/places/shared";

const GERMANY_MAP_VIRTUAL_CITY = {
  id: "virtual-de-discovery-map",
  slug: "deutschland",
  nameDe: "Deutschland",
  nameTr: "Almanya",
  isPilot: false,
} as const;

/** Per-city discovery map: genug für große Städte; Deutschland-Übersicht nutzt nur Cluster. */
const CITY_MAP_PLACE_FETCH_LIMIT = 2500;
const CITY_MAP_PLACE_MARKER_LIMIT = 2500;
const CITY_MAP_EVENT_FETCH_LIMIT = 120;
const CITY_MAP_EVENT_MARKER_LIMIT = 60;

async function loadFeaturedPlacesFull(
  rankedLiteTop: PublicPlaceRecordWithAiDiscoveryMap[],
): Promise<PublicPlaceRecordWithAi[]> {
  const ids = rankedLiteTop.map((p) => p.id);
  if (ids.length === 0) {
    return [];
  }
  const rows = await prisma.place.findMany({
    where: { id: { in: ids } },
    select: publicPlaceSelectWithAi,
  });
  const byId = new Map(rows.map((p) => [p.id, p]));
  return rankedLiteTop.map((p) => byId.get(p.id) ?? (p as unknown as PublicPlaceRecordWithAi));
}

function rankCityEvents(events: PublicEventRecordWithAi[]) {
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

function rankCityPlaces(
  places: readonly PublicPlaceRecordWithAi[] | readonly PublicPlaceRecordWithAiDiscoveryMap[],
) {
  return [...places].sort((left, right) =>
    compareByAiRanking<PublicPlaceRecordWithAi>(left as PublicPlaceRecordWithAi, right as PublicPlaceRecordWithAi, (placeLeft, placeRight) => {
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

export async function getPublicCityPage(citySlug: string, userId?: string) {
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
      isPilot: true,
      lat: true,
      lng: true,
    },
  });

  if (!city) {
    return null;
  }

  const cityCenter = resolveDiscoveryCityCenter(city.slug, city.lat, city.lng);

  const [mapPlacesLite, mapEvents, placeCount, eventCount] = await prisma.$transaction([
    prisma.place.findMany({
      where: buildPublicPlaceWhere({
        cityId: city.id,
      }),
      orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
      take: CITY_MAP_PLACE_FETCH_LIMIT,
      select: publicPlaceSelectWithAiDiscoveryMap,
    }),
    prisma.event.findMany({
      where: buildPublicEventWhere({
        cityId: city.id,
        startsAt: {
          gte: new Date(),
        },
      }),
      orderBy: { startsAt: "asc" },
      take: CITY_MAP_EVENT_FETCH_LIMIT,
      select: publicEventSelectWithAi,
    }),
    prisma.place.count({
      where: buildPublicPlaceWhere({
        cityId: city.id,
      }),
    }),
    prisma.event.count({
      where: buildPublicEventWhere({
        cityId: city.id,
        startsAt: { gte: new Date() },
      }),
    }),
  ]);

  const rankedPlacesAll = rankCityPlaces(mapPlacesLite);
  const rankedEventsAll = rankCityEvents(mapEvents);
  const featuredLiteTop = rankedPlacesAll.slice(0, 3) as PublicPlaceRecordWithAiDiscoveryMap[];
  const upcomingEvents = rankedEventsAll.slice(0, 3);

  const featuredPlacesFull = await loadFeaturedPlacesFull(featuredLiteTop);

  if (!userId) {
    return {
      city,
      cityCenter,
      placeCount,
      eventCount,
      featuredPlaces: featuredPlacesFull.map((place) => publicPlaceRecordForFlight(place, false)),
      mapPlaces: [],
      upcomingEvents: upcomingEvents.map((event) => publicEventRecordForFlight(event, false)),
      mapEvents: [],
    };
  }

  const [savedPlaces, savedEvents] = await prisma.$transaction([
    prisma.savedPlace.findMany({
      where: {
        userId,
        placeId: { in: featuredPlacesFull.map((place) => place.id) },
      },
      select: { placeId: true },
    }),
    prisma.savedEvent.findMany({
      where: {
        userId,
        eventId: { in: upcomingEvents.map((event) => event.id) },
      },
      select: { eventId: true },
    }),
  ]);

  const savedPlaceIds = new Set(savedPlaces.map((entry) => entry.placeId));
  const savedEventIds = new Set(savedEvents.map((entry) => entry.eventId));

  return {
    city,
    cityCenter,
    placeCount,
    eventCount,
    featuredPlaces: featuredPlacesFull.map((place) =>
      publicPlaceRecordForFlight(place, savedPlaceIds.has(place.id)),
    ),
    mapPlaces: [],
    upcomingEvents: upcomingEvents.map((event) =>
      publicEventRecordForFlight(event, savedEventIds.has(event.id)),
    ),
    mapEvents: [],
  };
}

export async function getDiscoveryMapPinsForCitySlug(citySlug: string, _userId?: string) {
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    select: { id: true },
  });

  if (!city) {
    return null;
  }

  const [mapPlaces, mapEvents] = await prisma.$transaction([
    prisma.place.findMany({
      where: buildPublicPlaceWhere({
        cityId: city.id,
      }),
      orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
      select: publicPlaceSelectWithAiDiscoveryMap,
    }),
    prisma.event.findMany({
      where: buildPublicEventWhere({
        cityId: city.id,
        startsAt: {
          gte: new Date(),
        },
      }),
      orderBy: { startsAt: "asc" },
      select: publicEventSelectWithAi,
    }),
  ]);

  const rankedPlaces = rankCityPlaces(mapPlaces).slice(0, CITY_MAP_PLACE_MARKER_LIMIT);
  const rankedEvents = rankCityEvents(mapEvents).slice(0, CITY_MAP_EVENT_MARKER_LIMIT);

  return {
    places: rankedPlaces.map((place) => publicPlaceRecordForFlight(place, false)),
    events: rankedEvents.map((event) => publicEventRecordForFlight(event, false)),
  };
}

export async function getPublicGermanyDiscoveryPage(userId?: string) {
  let placeCount = 0;
  let eventCount = 0;
  let germanyMapClusters: GermanyMapCluster[] = [];

  try {
    const summary = await getGermanyMapClustersSummary();
    placeCount = summary.placeCount;
    eventCount = summary.eventCount;
    germanyMapClusters = summary.clusters;
  } catch (error) {
    console.error("Failed to load Germany discovery summary", error);
  }

  const city = { ...GERMANY_MAP_VIRTUAL_CITY };

  return {
    city,
    cityCenter: GERMANY_DISCOVERY_CENTER,
    placeCount,
    eventCount,
    germanyMapClusters,
    featuredPlaces: [],
    mapPlaces: [],
    upcomingEvents: [],
    mapEvents: [],
  };
}
