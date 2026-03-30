import { prisma } from "@/lib/prisma";

import { DISCOVERY_LIST_LIMIT, discoverySignalsSince } from "./constants";
import type { DiscoveryCollectionReason, TrendingCollectionDiscoveryRow } from "./types";

/**
 * Public lists with recent additions or created in the signal window.
 * With `cityIds`, only counts additions of places in those cities (local discovery).
 */
export async function listTrendingCollectionsForDiscovery(args: {
  limit?: number;
  cityIds?: string[];
}): Promise<TrendingCollectionDiscoveryRow[]> {
  const since = discoverySignalsSince();
  const limit = args.limit ?? DISCOVERY_LIST_LIMIT;

  const itemWhere = {
    createdAt: { gte: since },
    collection: { visibility: "PUBLIC" as const },
    ...(args.cityIds?.length
      ? { place: { cityId: { in: args.cityIds } } }
      : {}),
  };

  const [itemGroups, newCollections] = await Promise.all([
    prisma.placeCollectionItem.groupBy({
      by: ["collectionId"],
      where: itemWhere,
      _count: { _all: true },
    }),
    prisma.placeCollection.findMany({
      where: {
        visibility: "PUBLIC",
        createdAt: { gte: since },
        ...(args.cityIds?.length
          ? { items: { some: { place: { cityId: { in: args.cityIds } } } } }
          : {}),
      },
      select: { id: true },
    }),
  ]);

  const meta = new Map<string, { adds: number; createdInWindow: boolean }>();

  for (const g of itemGroups) {
    meta.set(g.collectionId, {
      adds: g._count._all,
      createdInWindow: false,
    });
  }
  for (const c of newCollections) {
    const prev = meta.get(c.id) ?? { adds: 0, createdInWindow: false };
    prev.createdInWindow = true;
    meta.set(c.id, prev);
  }

  const ranked = [...meta.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .filter((r) => r.adds > 0 || r.createdInWindow)
    .sort((a, b) => {
      if (b.adds !== a.adds) {
        return b.adds - a.adds;
      }
      if (a.createdInWindow !== b.createdInWindow) {
        return Number(b.createdInWindow) - Number(a.createdInWindow);
      }
      return 0;
    })
    .slice(0, limit);

  if (ranked.length === 0) {
    return [];
  }

  const collections = await prisma.placeCollection.findMany({
    where: {
      id: { in: ranked.map((r) => r.id) },
      visibility: "PUBLIC",
    },
    select: { id: true, title: true },
  });

  const byId = new Map(collections.map((c) => [c.id, c]));
  const out: TrendingCollectionDiscoveryRow[] = [];

  for (const r of ranked) {
    const c = byId.get(r.id);
    if (!c) {
      continue;
    }
    let reason: DiscoveryCollectionReason;
    if (r.adds > 0) {
      reason = "recentAdds";
    } else {
      reason = "newList";
    }
    out.push({
      id: c.id,
      title: c.title,
      reason,
      recentAddCount: r.adds,
    });
  }

  return out;
}
