import { prisma } from "@/lib/prisma";
import { publicPlaceVisibilityWhere } from "./shared";

/** All place categories (for map UI, submission form, etc.), independent of current pin counts. */
export async function getAllPlaceCategoriesOrdered() {
  return prisma.placeCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameDe: "asc" }],
    select: {
      slug: true,
      nameDe: true,
      nameTr: true,
    },
  });
}

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
    getAllPlaceCategoriesOrdered(),
  ]);

  return { cities, categories };
}
