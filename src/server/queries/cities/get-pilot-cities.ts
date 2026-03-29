import { prisma } from "@/lib/prisma";
import { publicEventVisibilityWhere } from "@/server/queries/events/shared";
import { publicPlaceVisibilityWhere } from "@/server/queries/places/shared";

export async function getPilotCitySlugs() {
  return prisma.city.findMany({
    where: {
      isPilot: true,
    },
    orderBy: { nameDe: "asc" },
    select: {
      slug: true,
    },
  });
}

export async function getPilotCities() {
  const cities = await prisma.city.findMany({
    where: {
      isPilot: true,
    },
    orderBy: { nameDe: "asc" },
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  });

  if (cities.length === 0) {
    return [];
  }

  const cityIds = cities.map((city) => city.id);

  const [placeCounts, eventCounts] = await Promise.all([
    prisma.place.groupBy({
      by: ["cityId"],
      where: {
        cityId: { in: cityIds },
        ...publicPlaceVisibilityWhere,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.event.groupBy({
      by: ["cityId"],
      where: {
        cityId: { in: cityIds },
        startsAt: { gte: new Date() },
        ...publicEventVisibilityWhere,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const placeCountByCityId = new Map(
    placeCounts.map((entry) => [entry.cityId, entry._count._all]),
  );
  const eventCountByCityId = new Map(
    eventCounts.map((entry) => [entry.cityId, entry._count._all]),
  );

  return cities.map((city) => ({
    ...city,
    placesCount: placeCountByCityId.get(city.id) ?? 0,
    eventsCount: eventCountByCityId.get(city.id) ?? 0,
  }));
}
