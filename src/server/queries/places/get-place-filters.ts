import { prisma } from "@/lib/prisma";
import { buildPublicPlaceWhere, publicPlaceVisibilityWhere } from "./shared";

export type GetPlaceFiltersOptions = {
  /** If set, category dropdown only lists categories with ≥1 public place in that city. */
  categoryCitySlug?: string;
};

export async function getPlaceFilters(options?: GetPlaceFiltersOptions) {
  const citySlug = options?.categoryCitySlug?.trim();
  const categoryPlaceWhere = buildPublicPlaceWhere(
    citySlug ? { city: { slug: citySlug } } : {},
  );

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
          some: categoryPlaceWhere,
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
