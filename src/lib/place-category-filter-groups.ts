import type { CategoryFallbackVisualKey } from "@/lib/category-fallback-visual";
import { PLACE_SLUG_TO_VISUAL_KEY } from "@/lib/category-fallback-visual";
import { getOrderedPlaceCategoryVisualGroups } from "@/lib/place-category-onboarding-groups";

const orderedGroups = getOrderedPlaceCategoryVisualGroups();

/** Visual keys that map to more than one `place_category.slug` (same grouping as onboarding). */
export const PLACE_CATEGORY_MULTI_SLUG_VISUAL_KEYS = new Set(
  orderedGroups.filter((g) => g.slugs.length > 1).map((g) => g.key),
);

const multiSlugListByKey = new Map(
  orderedGroups.filter((g) => g.slugs.length > 1).map((g) => [g.key, g.slugs as string[]]),
);

const expandedSlugsForPlaceSlug = new Map<string, string[]>();
for (const [slug, key] of Object.entries(PLACE_SLUG_TO_VISUAL_KEY)) {
  const groupSlugs = multiSlugListByKey.get(key);
  if (groupSlugs) {
    expandedSlugsForPlaceSlug.set(slug, groupSlugs);
  }
}

export function isPlaceCategoryMultiSlugVisualKey(
  key: string,
): key is CategoryFallbackVisualKey {
  return PLACE_CATEGORY_MULTI_SLUG_VISUAL_KEYS.has(key as CategoryFallbackVisualKey);
}

/**
 * Expands filter tokens for Prisma `slug: { in: … }`:
 * - Multi-slug visual keys (`cafe`, `dining`, …) → all member slugs
 * - Any member slug of such a group → all member slugs (onboarding-aligned OR semantics)
 */
export function expandPlaceCategoryFilterTokensForQuery(
  tokens: string[] | undefined,
): string[] | undefined {
  if (!tokens?.length) {
    return undefined;
  }
  const out = new Set<string>();
  for (const raw of tokens) {
    const token = raw.trim();
    if (!token) {
      continue;
    }
    if (isPlaceCategoryMultiSlugVisualKey(token)) {
      const slugs = multiSlugListByKey.get(token);
      if (slugs) {
        for (const s of slugs) {
          out.add(s);
        }
      }
      continue;
    }
    const fromSlug = expandedSlugsForPlaceSlug.get(token);
    if (fromSlug) {
      for (const s of fromSlug) {
        out.add(s);
      }
      continue;
    }
    out.add(token);
  }
  const list = [...out];
  return list.length > 0 ? list : undefined;
}

/**
 * Collapses member slugs and group keys into one token per multi-slug group (URL + filter UI).
 */
export function collapsePlaceCategoryFilterTokens(
  tokens: string[] | undefined,
): string[] | undefined {
  if (!tokens?.length) {
    return undefined;
  }
  const remaining = new Set(tokens.map((t) => t.trim()).filter(Boolean));
  const collapsed: string[] = [];

  for (const { key, slugs } of orderedGroups) {
    if (slugs.length < 2) {
      continue;
    }
    const slugList = slugs as string[];
    if (remaining.has(key) || slugList.some((s) => remaining.has(s))) {
      collapsed.push(key);
      remaining.delete(key);
      for (const s of slugList) {
        remaining.delete(s);
      }
    }
  }

  for (const t of remaining) {
    collapsed.push(t);
  }

  return collapsed.length > 0 ? collapsed : undefined;
}

type CategoryRow = { slug: string; nameDe: string; nameTr: string };

/**
 * One filter row per visual group (multi-slug groups use the visual key as the form value).
 */
export function buildGroupedPlaceCategoryFilterOptions(args: {
  presentSlugs: ReadonlySet<string>;
  categoryRows: ReadonlyArray<CategoryRow>;
  locale: "de" | "tr";
  translateVisualGroup: (key: CategoryFallbackVisualKey) => string;
}): Array<{ slug: string; label: string }> {
  const rowBySlug = new Map(args.categoryRows.map((r) => [r.slug, r]));
  const out: Array<{ slug: string; label: string }> = [];

  for (const { key, slugs } of orderedGroups) {
    const presentInGroup = slugs.filter((s) => args.presentSlugs.has(s));
    if (presentInGroup.length === 0) {
      continue;
    }

    if (slugs.length === 1) {
      const slug = slugs[0]!;
      const row = rowBySlug.get(slug);
      if (!row) {
        continue;
      }
      out.push({
        slug,
        label: args.locale === "tr" ? row.nameTr : row.nameDe,
      });
      continue;
    }

    out.push({
      slug: key,
      label: args.translateVisualGroup(key),
    });
  }

  return out;
}
