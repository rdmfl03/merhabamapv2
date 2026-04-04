import type { CategoryFallbackVisualKey } from "@/lib/category-fallback-visual";
import { PLACE_SLUG_TO_VISUAL_KEY } from "@/lib/category-fallback-visual";
import { PLACE_CATEGORY_SEED_ROWS } from "@/lib/place-category-catalog";

const slugSortOrder = Object.fromEntries(
  PLACE_CATEGORY_SEED_ROWS.map((row) => [row.slug, row.sortOrder]),
);

/** Sorted unique keys for Zod `z.enum`. */
const _uniqueKeys = [...new Set(Object.values(PLACE_SLUG_TO_VISUAL_KEY))] as CategoryFallbackVisualKey[];
_uniqueKeys.sort((a, b) => a.localeCompare(b));

export const PLACE_CATEGORY_VISUAL_GROUP_KEY_ENUM = _uniqueKeys as unknown as [
  CategoryFallbackVisualKey,
  ...CategoryFallbackVisualKey[],
];

export function getOrderedPlaceCategoryVisualGroups(): Array<{
  key: CategoryFallbackVisualKey;
  slugs: readonly string[];
}> {
  const byKey = new Map<CategoryFallbackVisualKey, Set<string>>();

  for (const [slug, key] of Object.entries(PLACE_SLUG_TO_VISUAL_KEY)) {
    let set = byKey.get(key);
    if (!set) {
      set = new Set();
      byKey.set(key, set);
    }
    set.add(slug);
  }

  const rows = [...byKey.entries()].map(([key, slugs]) => {
    const slugList = [...slugs].sort(
      (a, b) => (slugSortOrder[a] ?? 999) - (slugSortOrder[b] ?? 999),
    );
    const sort = Math.min(...slugList.map((s) => slugSortOrder[s] ?? 999));
    return { key, slugs: slugList, sort };
  });

  rows.sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key));
  return rows.map(({ key, slugs }) => ({ key, slugs }));
}

export function visualGroupKeyForPlaceSlug(
  slug: string | null | undefined,
): CategoryFallbackVisualKey | null {
  const normalized = slug?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return null;
  }
  return PLACE_SLUG_TO_VISUAL_KEY[normalized] ?? null;
}
