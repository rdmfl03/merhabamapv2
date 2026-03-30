import { unstable_cache } from "next/cache";

import { MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE } from "@/lib/categories/public-category-browse";
import { prisma } from "@/lib/prisma";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

async function loadCategoryIdsEligibleForBrowseUncached(
  sortedUniqueCategoryIds: string[],
): Promise<Set<string>> {
  const rows = await prisma.place.groupBy({
    by: ["categoryId"],
    where: buildPublicPlaceWhere({ categoryId: { in: sortedUniqueCategoryIds } }),
    _count: { _all: true },
  });

  return new Set(
    rows
      .filter((r) => r._count._all >= MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE)
      .map((r) => r.categoryId),
  );
}

/**
 * Category IDs that have at least {@link MIN_PUBLIC_PLACES_FOR_CATEGORY_BROWSE} public places.
 * Cached briefly: public aggregate only, safe across users.
 */
export async function getCategoryIdsEligibleForBrowse(categoryIds: string[]): Promise<Set<string>> {
  const sorted = [...new Set(categoryIds)].sort();
  if (sorted.length === 0) {
    return new Set();
  }

  return unstable_cache(
    () => loadCategoryIdsEligibleForBrowseUncached(sorted),
    ["category-browse-eligibility", sorted.join(",")],
    { revalidate: 300 },
  )();
}
