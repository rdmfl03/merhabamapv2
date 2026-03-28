import { GERMANY_DISCOVERY_CENTER } from "@/lib/cities/discovery-city-center";
import { prisma } from "@/lib/prisma";
import { computeCategoryAdjustedScore, getPlaceScoreRatingCount } from "@/lib/places";
import { compareByAiRanking } from "@/server/queries/ai-shared";
import {
  buildPublicEventWhere,
  publicEventSelectWithAi,
  type PublicEventRecordWithAi,
} from "@/server/queries/events/shared";
import {
  buildPublicPlaceWhere,
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

const GERMANY_MAP_FETCH_LIMIT = 200;
const GERMANY_MAP_MARKER_LIMIT = 72;

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

function stripCityEventAiFields(event: PublicEventRecordWithAi) {
  const { aiReviewStatus: _aiReviewStatus, aiConfidenceScore: _aiConfidenceScore, createdAt: _createdAt, ...publicEvent } =
    event;

  return publicEvent;
}

function stripCityPlaceAiFields(place: PublicPlaceRecordWithAi) {
  const {
    aiReviewStatus: _aiReviewStatus,
    aiConfidenceScore: _aiConfidenceScore,
    createdAt: _createdAt,
    ...publicPlace
  } = place;

  return publicPlace;
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
      take: 36,
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
      take: 36,
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
      }),
    }),
  ]);

  const rankedPlaces = rankCityPlaces(mapPlaces).slice(0, 18);
  const rankedEvents = rankCityEvents(mapEvents).slice(0, 18);
  const featuredPlaces = rankedPlaces.slice(0, 3);
  const upcomingEvents = rankedEvents.slice(0, 3);

  if (!userId) {
    return {
      city,
      cityCenter,
      placeCount,
      eventCount,
      featuredPlaces: featuredPlaces.map((place) => ({
        ...stripCityPlaceAiFields(place),
        isSaved: false,
      })),
      mapPlaces: rankedPlaces.map((place) => ({
        ...stripCityPlaceAiFields(place),
        isSaved: false,
      })),
      upcomingEvents: upcomingEvents.map((event) => ({
        ...stripCityEventAiFields(event),
        isSaved: false,
      })),
      mapEvents: rankedEvents.map((event) => ({
        ...stripCityEventAiFields(event),
        isSaved: false,
      })),
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
    featuredPlaces: featuredPlaces.map((place) => ({
      ...stripCityPlaceAiFields(place),
      isSaved: savedPlaceIds.has(place.id),
    })),
    mapPlaces: rankedPlaces.map((place) => ({
      ...stripCityPlaceAiFields(place),
      isSaved: savedPlaceIds.has(place.id),
    })),
    upcomingEvents: upcomingEvents.map((event) => ({
      ...stripCityEventAiFields(event),
      isSaved: savedEventIds.has(event.id),
    })),
    mapEvents: rankedEvents.map((event) => ({
      ...stripCityEventAiFields(event),
      isSaved: savedEventIds.has(event.id),
    })),
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

  const [rawMapPlaces, rawMapEvents, placeCount, eventCount] = await prisma.$transaction([
    prisma.place.findMany({
      where: wherePlace,
      orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
      take: GERMANY_MAP_FETCH_LIMIT,
      select: publicPlaceSelectWithAi,
    }),
    prisma.event.findMany({
      where: whereEvent,
      orderBy: { startsAt: "asc" },
      take: GERMANY_MAP_FETCH_LIMIT,
      select: publicEventSelectWithAi,
    }),
    prisma.place.count({ where: wherePlace }),
    prisma.event.count({
      where: buildPublicEventWhere({
        city: { countryCode: "DE" },
      }),
    }),
  ]);

  const rankedPlacesAll = rankCityPlaces(rawMapPlaces);
  const rankedEventsAll = rankCityEvents(rawMapEvents);
  const featuredPlacesRanked = rankedPlacesAll.slice(0, 3);
  const upcomingEventsRanked = rankedEventsAll.slice(0, 3);
  const mapPlacesRanked = rankedPlacesAll.slice(0, GERMANY_MAP_MARKER_LIMIT);
  const mapEventsRanked = rankedEventsAll.slice(0, GERMANY_MAP_MARKER_LIMIT);

  const city = { ...GERMANY_MAP_VIRTUAL_CITY };

  if (!userId) {
    return {
      city,
      cityCenter: GERMANY_DISCOVERY_CENTER,
      placeCount,
      eventCount,
      featuredPlaces: featuredPlacesRanked.map((place) => ({
        ...stripCityPlaceAiFields(place),
        isSaved: false,
      })),
      mapPlaces: mapPlacesRanked.map((place) => ({
        ...stripCityPlaceAiFields(place),
        isSaved: false,
      })),
      upcomingEvents: upcomingEventsRanked.map((event) => ({
        ...stripCityEventAiFields(event),
        isSaved: false,
      })),
      mapEvents: mapEventsRanked.map((event) => ({
        ...stripCityEventAiFields(event),
        isSaved: false,
      })),
    };
  }

  const [savedPlaces, savedEvents] = await prisma.$transaction([
    prisma.savedPlace.findMany({
      where: {
        userId,
        placeId: { in: mapPlacesRanked.map((place) => place.id) },
      },
      select: { placeId: true },
    }),
    prisma.savedEvent.findMany({
      where: {
        userId,
        eventId: { in: mapEventsRanked.map((event) => event.id) },
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
    featuredPlaces: featuredPlacesRanked.map((place) => ({
      ...stripCityPlaceAiFields(place),
      isSaved: savedPlaceIds.has(place.id),
    })),
    mapPlaces: mapPlacesRanked.map((place) => ({
      ...stripCityPlaceAiFields(place),
      isSaved: savedPlaceIds.has(place.id),
    })),
    upcomingEvents: upcomingEventsRanked.map((event) => ({
      ...stripCityEventAiFields(event),
      isSaved: savedEventIds.has(event.id),
    })),
    mapEvents: mapEventsRanked.map((event) => ({
      ...stripCityEventAiFields(event),
      isSaved: savedEventIds.has(event.id),
    })),
  };
}
