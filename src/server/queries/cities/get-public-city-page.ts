import { prisma } from "@/lib/prisma";
import { computePlaceScore, getPlaceScoreRatingCount } from "@/lib/places";
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
      const scoreDiff = computePlaceScore(placeRight) - computePlaceScore(placeLeft);
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
