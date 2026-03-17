import { prisma } from "@/lib/prisma";
import {
  buildPublicEventWhere,
  publicEventSelect,
} from "@/server/queries/events/shared";
import {
  buildPublicPlaceWhere,
  publicPlaceSelect,
} from "@/server/queries/places/shared";

const pilotCityCenters: Record<string, { latitude: number; longitude: number }> = {
  berlin: { latitude: 52.52, longitude: 13.405 },
  koeln: { latitude: 50.9375, longitude: 6.9603 },
};

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
      take: 18,
      select: publicPlaceSelect,
    }),
    prisma.event.findMany({
      where: buildPublicEventWhere({
        cityId: city.id,
        startsAt: {
          gte: new Date(),
        },
      }),
      orderBy: { startsAt: "asc" },
      take: 18,
      select: publicEventSelect,
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

  const featuredPlaces = mapPlaces.slice(0, 3);
  const upcomingEvents = mapEvents.slice(0, 3);

  if (!userId) {
    return {
      city,
      cityCenter,
      placeCount,
      eventCount,
      featuredPlaces: featuredPlaces.map((place) => ({
        ...place,
        isSaved: false,
      })),
      mapPlaces: mapPlaces.map((place) => ({
        ...place,
        isSaved: false,
      })),
      upcomingEvents: upcomingEvents.map((event) => ({
        ...event,
        isSaved: false,
      })),
      mapEvents: mapEvents.map((event) => ({
        ...event,
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
      ...place,
      isSaved: savedPlaceIds.has(place.id),
    })),
    mapPlaces: mapPlaces.map((place) => ({
      ...place,
      isSaved: savedPlaceIds.has(place.id),
    })),
    upcomingEvents: upcomingEvents.map((event) => ({
      ...event,
      isSaved: savedEventIds.has(event.id),
    })),
    mapEvents: mapEvents.map((event) => ({
      ...event,
      isSaved: savedEventIds.has(event.id),
    })),
  };
}
