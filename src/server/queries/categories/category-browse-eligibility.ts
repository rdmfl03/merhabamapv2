import { unstable_cache } from "next/cache";

import { MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE } from "@/lib/categories/public-category-browse";
import { prisma } from "@/lib/prisma";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

async function loadCategoryIdsEligibleForBrowseUncached(
  sortedUniqueCategoryIds: string[],
): Promise<string[]> {
  const rows = await prisma.place.groupBy({
    by: ["categoryId"],
    where: buildPublicPlaceWhere({ categoryId: { in: sortedUniqueCategoryIds } }),
    _count: { _all: true },
  });

  return rows
    .filter((r) => r._count._all >= MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE)
    .map((r) => r.categoryId);
}

/**
 * Category IDs that have at least {@link MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE} public places.
 * Cached briefly: public aggregate only, safe across users.
 */
export async function getCategoryIdsEligibleForBrowse(categoryIds: string[]): Promise<string[]> {
  const sorted = [...new Set(categoryIds)].sort();
  if (sorted.length === 0) {
    return [];
  }

  return unstable_cache(
    () => loadCategoryIdsEligibleForBrowseUncached(sorted),
    ["category-browse-eligibility", sorted.join(",")],
    { revalidate: 300 },
  )();
}
