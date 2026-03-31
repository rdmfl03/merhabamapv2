import { prisma } from "@/lib/prisma";
import { resolveDiscoveryCityCenter } from "@/lib/cities/discovery-city-center";
import { buildPublicEventWhere } from "@/server/queries/events/shared";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

export type DiscoveryMapCityOption = {
  slug: string;
  nameDe: string;
  nameTr: string;
  latitude: number;
  longitude: number;
};

export async function getDiscoveryMapCityOptions(): Promise<DiscoveryMapCityOption[]> {
  try {
    const [placeRows, eventRows] = await Promise.all([
      prisma.place.findMany({
        where: buildPublicPlaceWhere({
          city: { countryCode: "DE" },
        }),
        select: { cityId: true },
        distinct: ["cityId"],
      }),
      prisma.event.findMany({
        where: buildPublicEventWhere({
          city: { countryCode: "DE" },
          startsAt: { gte: new Date() },
        }),
        select: { cityId: true },
        distinct: ["cityId"],
      }),
    ]);

    const cityIds = new Set<string>();
    for (const row of placeRows) {
      cityIds.add(row.cityId);
    }
    for (const row of eventRows) {
      cityIds.add(row.cityId);
    }

    const pilotCityRows = await prisma.city.findMany({
      where: { isPilot: true, countryCode: "DE" },
      select: { id: true },
    });
    for (const row of pilotCityRows) {
      cityIds.add(row.id);
    }

    if (cityIds.size === 0) {
      return [];
    }

    const cities = await prisma.city.findMany({
      where: { id: { in: [...cityIds] } },
      orderBy: { nameDe: "asc" },
      select: {
        slug: true,
        nameDe: true,
        nameTr: true,
        lat: true,
        lng: true,
      },
    });

    return cities
      .map((city) => {
        const center = resolveDiscoveryCityCenter(city.slug, city.lat, city.lng);
        return {
          slug: city.slug,
          nameDe: city.nameDe,
          nameTr: city.nameTr,
          latitude: center.latitude,
          longitude: center.longitude,
        };
      })
      .filter(
        (row) =>
          Number.isFinite(row.latitude) &&
          Number.isFinite(row.longitude) &&
          Math.abs(row.latitude) <= 90 &&
          Math.abs(row.longitude) <= 180,
      );
  } catch {
    return [];
  }
}
