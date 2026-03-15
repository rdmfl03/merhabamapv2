import { EventCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getEventFilters() {
  const cities = await prisma.city.findMany({
    where: {
      events: {
        some: {
          isPublished: true,
          moderationStatus: "APPROVED",
        },
      },
    },
    orderBy: { nameDe: "asc" },
    select: {
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  });

  return {
    cities,
    categories: Object.values(EventCategory),
  };
}
