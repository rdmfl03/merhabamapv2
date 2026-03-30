import type { EventCategory } from "@prisma/client";

import { appConfig } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";

const eventCategories: EventCategory[] = [
  "CONCERT",
  "CULTURE",
  "STUDENT",
  "COMMUNITY",
  "FAMILY",
  "BUSINESS",
  "RELIGIOUS",
];

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
    eventCategories,
    existingPlaces,
    existingEvents,
  };
}
