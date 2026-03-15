import { prisma } from "@/lib/prisma";
import { publicEventSelect } from "@/server/queries/events/shared";
import { publicPlaceSelect } from "@/server/queries/places/shared";

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

  const [featuredPlaces, upcomingEvents, placeCount, eventCount] = await Promise.all([
    prisma.place.findMany({
      where: {
        cityId: city.id,
        isPublished: true,
        moderationStatus: "APPROVED",
      },
      orderBy: [{ verificationStatus: "desc" }, { createdAt: "desc" }],
      take: 3,
      select: publicPlaceSelect,
    }),
    prisma.event.findMany({
      where: {
        cityId: city.id,
        isPublished: true,
        moderationStatus: "APPROVED",
        startsAt: {
          gte: new Date(),
        },
      },
      orderBy: { startsAt: "asc" },
      take: 3,
      select: publicEventSelect,
    }),
    prisma.place.count({
      where: {
        cityId: city.id,
        isPublished: true,
        moderationStatus: "APPROVED",
      },
    }),
    prisma.event.count({
      where: {
        cityId: city.id,
        isPublished: true,
        moderationStatus: "APPROVED",
      },
    }),
  ]);

  if (!userId) {
    return {
      city,
      placeCount,
      eventCount,
      featuredPlaces: featuredPlaces.map((place) => ({
        ...place,
        isSaved: false,
      })),
      upcomingEvents: upcomingEvents.map((event) => ({
        ...event,
        isSaved: false,
      })),
    };
  }

  const [savedPlaces, savedEvents] = await Promise.all([
    prisma.savedPlace.findMany({
      where: {
        userId,
        placeId: {
          in: featuredPlaces.map((place) => place.id),
        },
      },
      select: { placeId: true },
    }),
    prisma.savedEvent.findMany({
      where: {
        userId,
        eventId: {
          in: upcomingEvents.map((event) => event.id),
        },
      },
      select: { eventId: true },
    }),
  ]);

  const savedPlaceIds = new Set(savedPlaces.map((entry) => entry.placeId));
  const savedEventIds = new Set(savedEvents.map((entry) => entry.eventId));

  return {
    city,
    placeCount,
    eventCount,
    featuredPlaces: featuredPlaces.map((place) => ({
      ...place,
      isSaved: savedPlaceIds.has(place.id),
    })),
    upcomingEvents: upcomingEvents.map((event) => ({
      ...event,
      isSaved: savedEventIds.has(event.id),
    })),
  };
}
