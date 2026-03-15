import { prisma } from "@/lib/prisma";

export async function getPlaceFilters() {
  const [cities, categories] = await Promise.all([
    prisma.city.findMany({
      where: {
        places: {
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
    }),
    prisma.placeCategory.findMany({
      where: {
        places: {
          some: {
            isPublished: true,
            moderationStatus: "APPROVED",
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
