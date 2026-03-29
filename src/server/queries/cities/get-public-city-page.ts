import { GERMANY_DISCOVERY_CENTER } from "@/lib/cities/discovery-city-center";
import { prisma } from "@/lib/prisma";
import { getGermanyMapClusters } from "@/server/queries/cities/get-germany-map-clusters";
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
  type PublicPlaceRecordWithAi,
} from "@/server/queries/places/shared";

const pilotCityCenters: Record<string, { latitude: number; longitude: number }> = {
  berlin: { latitude: 52.52, longitude: 13.405 },
  koeln: { latitude: 50.9375, longitude: 6.9603 },
};

const GERMANY_MAP_VIRTUAL_CITY = {
  id: "virtual-de-discovery-map",
  slug: "deutschland",
  nameDe: "Deutschland",
  nameTr: "Almanya",
  isPilot: false,
} as const;

/** Per-city discovery map: was 36 → 18 markers; too small for cities with many venues. */
const CITY_MAP_PLACE_FETCH_LIMIT = 400;
const CITY_MAP_PLACE_MARKER_LIMIT = 400;
const CITY_MAP_EVENT_FETCH_LIMIT = 120;
const CITY_MAP_EVENT_MARKER_LIMIT = 60;

/** Sample size for national homepage featured cards (not map pins). */
const GERMANY_FEATURED_SAMPLE = 96;

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

function rankCityPlaces(places: PublicPlaceRecordWithAi[]) {
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

export async function getPublicCityPage(citySlug: string, userId?: string) {
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
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

  const cityCenter = pilotCityCenters[city.slug] ?? null;

  const [mapPlaces, mapEvents, placeCount, eventCount] = await prisma.$transaction([
    prisma.place.findMany({
      where: buildPublicPlaceWhere({
        cityId: city.id,
      }),
      orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
      take: CITY_MAP_PLACE_FETCH_LIMIT,
      select: publicPlaceSelectWithAi,
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

  const rankedPlacesAll = rankCityPlaces(mapPlaces);
  const rankedEventsAll = rankCityEvents(mapEvents);
  const rankedPlaces = rankedPlacesAll.slice(0, CITY_MAP_PLACE_MARKER_LIMIT);
  const rankedEvents = rankedEventsAll.slice(0, CITY_MAP_EVENT_MARKER_LIMIT);
  const featuredPlaces = rankedPlacesAll.slice(0, 3);
  const upcomingEvents = rankedEventsAll.slice(0, 3);

  if (!userId) {
    return {
      city,
      cityCenter,
      placeCount,
      eventCount,
      featuredPlaces: featuredPlaces.map((place) => publicPlaceRecordForFlight(place, false)),
      mapPlaces: rankedPlaces.map((place) => publicPlaceRecordForFlight(place, false)),
      upcomingEvents: upcomingEvents.map((event) => publicEventRecordForFlight(event, false)),
      mapEvents: rankedEvents.map((event) => publicEventRecordForFlight(event, false)),
    };
  }

  const [savedPlaces, savedEvents] = await prisma.$transaction([
    prisma.savedPlace.findMany({
      where: {
        userId,
        placeId: { in: mapPlaces.map((place) => place.id) },
      },
      select: { placeId: true },
    }),
    prisma.savedEvent.findMany({
      where: {
        userId,
        eventId: { in: mapEvents.map((event) => event.id) },
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
    featuredPlaces: featuredPlaces.map((place) =>
      publicPlaceRecordForFlight(place, savedPlaceIds.has(place.id)),
    ),
    mapPlaces: rankedPlaces.map((place) =>
      publicPlaceRecordForFlight(place, savedPlaceIds.has(place.id)),
    ),
    upcomingEvents: upcomingEvents.map((event) =>
      publicEventRecordForFlight(event, savedEventIds.has(event.id)),
    ),
    mapEvents: rankedEvents.map((event) =>
      publicEventRecordForFlight(event, savedEventIds.has(event.id)),
    ),
  };
}

export async function getDiscoveryMapPinsForCitySlug(citySlug: string, userId?: string) {
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
      select: publicPlaceSelectWithAi,
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

  const rankedPlaces = rankCityPlaces(mapPlaces);
  const rankedEvents = rankCityEvents(mapEvents);

  if (!userId) {
    return {
      places: rankedPlaces.map((place) => publicPlaceRecordForFlight(place, false)),
      events: rankedEvents.map((event) => publicEventRecordForFlight(event, false)),
    };
  }

  const [savedPlaces, savedEvents] = await prisma.$transaction([
    prisma.savedPlace.findMany({
      where: {
        userId,
        placeId: { in: rankedPlaces.map((place) => place.id) },
      },
      select: { placeId: true },
    }),
    prisma.savedEvent.findMany({
      where: {
        userId,
        eventId: { in: rankedEvents.map((event) => event.id) },
      },
      select: { eventId: true },
    }),
  ]);

  const savedPlaceIds = new Set(savedPlaces.map((entry) => entry.placeId));
  const savedEventIds = new Set(savedEvents.map((entry) => entry.eventId));

  return {
    places: rankedPlaces.map((place) =>
      publicPlaceRecordForFlight(place, savedPlaceIds.has(place.id)),
    ),
    events: rankedEvents.map((event) =>
      publicEventRecordForFlight(event, savedEventIds.has(event.id)),
    ),
  };
}

export async function getPublicGermanyDiscoveryPage(userId?: string) {
  const wherePlace = buildPublicPlaceWhere({
    city: { countryCode: "DE" },
  });
  const whereEvent = buildPublicEventWhere({
    city: { countryCode: "DE" },
    startsAt: {
      gte: new Date(),
    },
  });

  const [
    rawFeaturedPlaces,
    rawFeaturedEvents,
    placeCount,
    eventCount,
    germanyMapClusters,
  ] = await Promise.all([
    prisma.place.findMany({
      where: wherePlace,
      orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
      take: GERMANY_FEATURED_SAMPLE,
      select: publicPlaceSelectWithAi,
    }),
    prisma.event.findMany({
      where: whereEvent,
      orderBy: { startsAt: "asc" },
      take: GERMANY_FEATURED_SAMPLE,
      select: publicEventSelectWithAi,
    }),
    prisma.place.count({ where: wherePlace }),
    prisma.event.count({
      where: buildPublicEventWhere({
        city: { countryCode: "DE" },
        startsAt: { gte: new Date() },
      }),
    }),
    getGermanyMapClusters(),
  ]);

  const rankedFeaturedPlaces = rankCityPlaces(rawFeaturedPlaces);
  const rankedFeaturedEvents = rankCityEvents(rawFeaturedEvents);
  const featuredPlacesRanked = rankedFeaturedPlaces.slice(0, 3);
  const upcomingEventsRanked = rankedFeaturedEvents.slice(0, 3);

  const city = { ...GERMANY_MAP_VIRTUAL_CITY };

  if (!userId) {
    return {
      city,
      cityCenter: GERMANY_DISCOVERY_CENTER,
      placeCount,
      eventCount,
      germanyMapClusters,
      featuredPlaces: featuredPlacesRanked.map((place) =>
        publicPlaceRecordForFlight(place, false),
      ),
      mapPlaces: [],
      upcomingEvents: upcomingEventsRanked.map((event) =>
        publicEventRecordForFlight(event, false),
      ),
      mapEvents: [],
    };
  }

  const [savedPlaces, savedEvents] = await prisma.$transaction([
    prisma.savedPlace.findMany({
      where: {
        userId,
        placeId: { in: featuredPlacesRanked.map((place) => place.id) },
      },
      select: { placeId: true },
    }),
    prisma.savedEvent.findMany({
      where: {
        userId,
        eventId: { in: upcomingEventsRanked.map((event) => event.id) },
      },
      select: { eventId: true },
    }),
  ]);

  const savedPlaceIds = new Set(savedPlaces.map((entry) => entry.placeId));
  const savedEventIds = new Set(savedEvents.map((entry) => entry.eventId));

  return {
    city,
    cityCenter: GERMANY_DISCOVERY_CENTER,
    placeCount,
    eventCount,
    germanyMapClusters,
    featuredPlaces: featuredPlacesRanked.map((place) =>
      publicPlaceRecordForFlight(place, savedPlaceIds.has(place.id)),
    ),
    mapPlaces: [],
    upcomingEvents: upcomingEventsRanked.map((event) =>
      publicEventRecordForFlight(event, savedEventIds.has(event.id)),
    ),
    mapEvents: [],
  };
}
