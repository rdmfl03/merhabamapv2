import type { EventCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const PILOT_CITY_SLUGS = ["berlin", "koeln"] as const;

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
          in: [...PILOT_CITY_SLUGS],
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
            in: [...PILOT_CITY_SLUGS],
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
            in: [...PILOT_CITY_SLUGS],
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
