import { resolveDiscoveryCityCenter } from "@/lib/cities/discovery-city-center";
import type { GermanyMapCluster } from "@/lib/cities/germany-map-cluster";
import { prisma } from "@/lib/prisma";
import { buildPublicEventWhere } from "@/server/queries/events/shared";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

export async function getGermanyMapClusters(): Promise<GermanyMapCluster[]> {
  const wherePlace = buildPublicPlaceWhere({
    city: { countryCode: "DE" },
  });
  const whereEvent = buildPublicEventWhere({
    city: { countryCode: "DE" },
    startsAt: { gte: new Date() },
  });

  const [placeGroups, eventGroups] = await Promise.all([
    prisma.place.groupBy({
      by: ["cityId"],
      where: wherePlace,
      _count: { _all: true },
    }),
    prisma.event.groupBy({
      by: ["cityId"],
      where: whereEvent,
      _count: { _all: true },
    }),
  ]);

  const countsByCity = new Map<string, { placeCount: number; eventCount: number }>();

  for (const row of placeGroups) {
    countsByCity.set(row.cityId, {
      placeCount: row._count._all,
      eventCount: 0,
    });
  }

  for (const row of eventGroups) {
    const prev = countsByCity.get(row.cityId) ?? { placeCount: 0, eventCount: 0 };
    prev.eventCount = row._count._all;
    countsByCity.set(row.cityId, prev);
  }

  const cityIds = [...countsByCity.keys()];
  if (cityIds.length === 0) {
    return [];
  }

  const cities = await prisma.city.findMany({
    where: { id: { in: cityIds } },
    orderBy: { nameDe: "asc" },
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
      lat: true,
      lng: true,
    },
  });

  return cities.map((city) => {
    const counts = countsByCity.get(city.id) ?? { placeCount: 0, eventCount: 0 };
    const center = resolveDiscoveryCityCenter(city.slug, city.lat, city.lng);
    return {
      slug: city.slug,
      nameDe: city.nameDe,
      nameTr: city.nameTr,
      latitude: center.latitude,
      longitude: center.longitude,
      placeCount: counts.placeCount,
      eventCount: counts.eventCount,
    };
  });
}
