import { prisma } from "@/lib/prisma";

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

  return Promise.all(
    cities.map(async (city) => {
      const [placesCount, eventsCount] = await Promise.all([
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

      return {
        ...city,
        placesCount,
        eventsCount,
      };
    }),
  );
}
