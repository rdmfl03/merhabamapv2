import { MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE } from "@/lib/categories/public-category-browse";
import { prisma } from "@/lib/prisma";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

export type PublicCategoryBrowseSummary = {
  id: string;
  slug: string;
  nameDe: string;
  nameTr: string;
  placeCount: number;
};

/** Categories that qualify for public browse (sitemap, index, [slug] pages). */
export async function listPublicCategoryBrowseSummaries(): Promise<PublicCategoryBrowseSummary[]> {
  const groups = await prisma.place.groupBy({
    by: ["categoryId"],
    where: buildPublicPlaceWhere(),
    _count: { _all: true },
  });

  const eligibleIds = groups
    .filter((g) => g._count._all >= MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE)
    .map((g) => g.categoryId);

  if (eligibleIds.length === 0) {
    return [];
  }

  const categories = await prisma.placeCategory.findMany({
    where: { id: { in: eligibleIds } },
    orderBy: [{ sortOrder: "asc" }, { nameDe: "asc" }],
    select: { id: true, slug: true, nameDe: true, nameTr: true },
  });

  const countBy = new Map(groups.map((g) => [g.categoryId, g._count._all]));

  return categories.map((c) => ({
    ...c,
    placeCount: countBy.get(c.id) ?? 0,
  }));
}
