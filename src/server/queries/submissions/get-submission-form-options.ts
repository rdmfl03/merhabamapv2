import { appConfig } from "@/lib/app-config";
import { EVENT_CATEGORY_VALUES } from "@/lib/event-category-values";
import { prisma } from "@/lib/prisma";

export async function getSubmissionFormOptions() {
  const [cities, placeCategories, existingPlaces, existingEvents] = await Promise.all([
    prisma.city.findMany({
      where: {
        countryCode: "DE",
        slug: {
          in: [...appConfig.pilotCities],
        },
      },
      orderBy: [{ nameDe: "asc" }],
      select: {
        id: true,
        slug: true,
        nameDe: true,
        nameTr: true,
      },
    }),
    prisma.placeCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameDe: "asc" }],
      select: {
        id: true,
        slug: true,
        nameDe: true,
        nameTr: true,
      },
    }),
    prisma.place.findMany({
      where: {
        city: {
          slug: {
            in: [...appConfig.pilotCities],
          },
        },
      },
      select: {
        name: true,
        cityId: true,
      },
      take: 200,
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.event.findMany({
      where: {
        city: {
          slug: {
            in: [...appConfig.pilotCities],
          },
        },
      },
      select: {
        title: true,
        cityId: true,
        startsAt: true,
      },
      take: 200,
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  return {
    cities,
    placeCategories,
    eventCategories: [...EVENT_CATEGORY_VALUES],
    existingPlaces,
    existingEvents,
  };
}
