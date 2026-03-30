import type { Prisma } from "@prisma/client";

import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { prisma } from "@/lib/prisma";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

import { DISCOVERY_LIST_LIMIT, discoverySignalsSince } from "./constants";
import { pickPlaceDiscoveryReason } from "./place-reason";
import type { TrendingPlaceDiscoveryRow } from "./types";

/**
 * Places with the most combined recent saves, comments, and public list adds.
 * Only published/approved places; optional city filter for local discovery.
 */
export async function listTrendingPlacesForDiscovery(args: {
  locale: "de" | "tr";
  cityIds?: string[];
  /** When set, only signals for places in this category (e.g. category browse). */
  categoryId?: string;
  limit?: number;
}): Promise<TrendingPlaceDiscoveryRow[]> {
  const since = discoverySignalsSince();
  const limit = args.limit ?? DISCOVERY_LIST_LIMIT;
  const placeScope = buildPublicPlaceWhere({
    ...(args.cityIds?.length ? { cityId: { in: args.cityIds } } : {}),
    ...(args.categoryId ? { categoryId: args.categoryId } : {}),
  });

  type PlaceCommentScope =
    | { mode: "global" }
    | { mode: "empty" }
    | { mode: "in"; ids: string[] };

  let placeCommentScope: PlaceCommentScope = { mode: "global" };
  if (args.cityIds?.length) {
    const rows = await prisma.place.findMany({
      where: placeScope,
      select: { id: true },
    });
    const MAX_SCOPE_IDS = 12_000;
    if (rows.length === 0) {
      placeCommentScope = { mode: "empty" };
    } else if (rows.length > MAX_SCOPE_IDS) {
      placeCommentScope = { mode: "global" };
    } else {
      placeCommentScope = { mode: "in", ids: rows.map((r) => r.id) };
    }
  }

  const commentWhere: Prisma.EntityCommentWhereInput = {
    entityType: "place",
    deletedAt: null,
    createdAt: { gte: since },
    ...(placeCommentScope.mode === "in" ? { entityId: { in: placeCommentScope.ids } } : {}),
  };

  const commentGroupsPromise =
    placeCommentScope.mode === "empty"
      ? Promise.resolve(([] as { entityId: string; _count: { _all: number } }[]))
      : prisma.entityComment.groupBy({
          by: ["entityId"],
          where: commentWhere,
          _count: { _all: true },
        });

  const [saveGroups, commentGroups, listGroups] = await Promise.all([
    prisma.savedPlace.groupBy({
      by: ["placeId"],
      where: {
        createdAt: { gte: since },
        place: placeScope,
      },
      _count: { _all: true },
    }),
    commentGroupsPromise,
    prisma.placeCollectionItem.groupBy({
      by: ["placeId"],
      where: {
        createdAt: { gte: since },
        collection: { visibility: "PUBLIC" },
        place: placeScope,
      },
      _count: { _all: true },
    }),
  ]);

  const validCommentPlaceIds = new Set<string>();
  if (commentGroups.length > 0 && placeCommentScope.mode === "global") {
    const ids = commentGroups.map((g) => g.entityId);
    const valid = await prisma.place.findMany({
      where: buildPublicPlaceWhere({
        id: { in: ids },
        ...(args.cityIds?.length ? { cityId: { in: args.cityIds } } : {}),
        ...(args.categoryId ? { categoryId: args.categoryId } : {}),
      }),
      select: { id: true },
    });
    for (const p of valid) {
      validCommentPlaceIds.add(p.id);
    }
  }

  const scores = new Map<string, { saves: number; comments: number; listed: number }>();

  const bump = (id: string, key: "saves" | "comments" | "listed", n: number) => {
    const cur = scores.get(id) ?? { saves: 0, comments: 0, listed: 0 };
    cur[key] += n;
    scores.set(id, cur);
  };

  for (const g of saveGroups) {
    bump(g.placeId, "saves", g._count._all);
  }
  const useScopedComments = placeCommentScope.mode === "in";
  for (const g of commentGroups) {
    if (useScopedComments || validCommentPlaceIds.has(g.entityId)) {
      bump(g.entityId, "comments", g._count._all);
    }
  }
  for (const g of listGroups) {
    bump(g.placeId, "listed", g._count._all);
  }

  const ranked = [...scores.entries()]
    .map(([placeId, counts]) => ({
      placeId,
      total: counts.saves + counts.comments + counts.listed,
      counts,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  if (ranked.length === 0) {
    return [];
  }

  const places = await prisma.place.findMany({
    where: { id: { in: ranked.map((r) => r.placeId) } },
    select: {
      id: true,
      slug: true,
      name: true,
      city: { select: { id: true, slug: true, nameDe: true, nameTr: true } },
    },
  });

  const placeById = new Map(places.map((p) => [p.id, p]));
  const out: TrendingPlaceDiscoveryRow[] = [];

  for (const r of ranked) {
    const p = placeById.get(r.placeId);
    if (!p) {
      continue;
    }
    out.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      cityLabel: getLocalizedCityDisplayName(args.locale, p.city),
      reason: pickPlaceDiscoveryReason(r.counts),
    });
  }

  return out;
}
