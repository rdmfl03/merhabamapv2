import { EventCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { publicEventVisibilityWhere } from "./shared";

export async function getEventFilters() {
  const cities = await prisma.city.findMany({
    where: {
      events: {
        some: {
          ...publicEventVisibilityWhere,
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
