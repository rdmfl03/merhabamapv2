import { prisma } from "@/lib/prisma";
import { publicPlaceVisibilityWhere } from "./shared";

export async function getPlaceFilters() {
  const [cities, categories] = await Promise.all([
    prisma.city.findMany({
      where: {
        places: {
          some: {
            ...publicPlaceVisibilityWhere,
          },
        },
      },
      orderBy: { nameDe: "asc" },
      select: {
        slug: true,
        nameDe: true,
        nameTr: true,
      },
    }),
    prisma.placeCategory.findMany({
      where: {
        places: {
          some: {
            ...publicPlaceVisibilityWhere,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { nameDe: "asc" }],
      select: {
        slug: true,
        nameDe: true,
        nameTr: true,
      },
    }),
  ]);

  return { cities, categories };
}
