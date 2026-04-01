import { prisma } from "@/lib/prisma";
import { buildPublicEventWhere } from "@/server/queries/events/shared";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

export async function getActiveCities() {
  const [placeRows, eventRows, pilotCityRows] = await Promise.all([
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
    prisma.city.findMany({
      where: {
        isPilot: true,
        countryCode: "DE",
      },
      select: { id: true },
    }),
  ]);

  const cityIds = new Set<string>();
  for (const row of placeRows) {
    cityIds.add(row.cityId);
  }
  for (const row of eventRows) {
    cityIds.add(row.cityId);
  }
  for (const row of pilotCityRows) {
    cityIds.add(row.id);
  }

  if (cityIds.size === 0) {
    return [];
  }

  return prisma.city.findMany({
    where: {
      id: { in: [...cityIds] },
    },
    orderBy: {
      nameDe: "asc",
    },
    select: {
      id: true,
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  });
}
