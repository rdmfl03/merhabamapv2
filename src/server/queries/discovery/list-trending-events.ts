import type { Prisma } from "@prisma/client";

import { getLocalizedCityDisplayName } from "@/lib/cities/city-display-name";
import { prisma } from "@/lib/prisma";
import { buildPublicEventWhere } from "@/server/queries/events/shared";

import { DISCOVERY_LIST_LIMIT, discoverySignalsSince } from "./constants";
import { pickEventDiscoveryReason } from "./event-reason";
import type { TrendingEventDiscoveryRow } from "./types";

/**
 * Upcoming public events with recent participation, comments, or saves.
 */
export async function listTrendingEventsForDiscovery(args: {
  locale: "de" | "tr";
  cityIds?: string[];
  limit?: number;
}): Promise<TrendingEventDiscoveryRow[]> {
  const since = discoverySignalsSince();
  const now = new Date();
  const limit = args.limit ?? DISCOVERY_LIST_LIMIT;

  const eventScope = buildPublicEventWhere({
    startsAt: { gte: now },
    ...(args.cityIds?.length ? { cityId: { in: args.cityIds } } : {}),
  });

  type EventCommentScope =
    | { mode: "global" }
    | { mode: "empty" }
    | { mode: "in"; ids: string[] };

  let eventCommentScope: EventCommentScope = { mode: "global" };
  if (args.cityIds?.length) {
    const rows = await prisma.event.findMany({
      where: eventScope,
      select: { id: true },
    });
    const MAX_SCOPE_IDS = 12_000;
    if (rows.length === 0) {
      eventCommentScope = { mode: "empty" };
    } else if (rows.length > MAX_SCOPE_IDS) {
      eventCommentScope = { mode: "global" };
    } else {
      eventCommentScope = { mode: "in", ids: rows.map((r) => r.id) };
    }
  }

  const commentWhere: Prisma.EntityCommentWhereInput = {
    entityType: "event",
    deletedAt: null,
    createdAt: { gte: since },
    ...(eventCommentScope.mode === "in" ? { entityId: { in: eventCommentScope.ids } } : {}),
  };

  const commentGroupsPromise =
    eventCommentScope.mode === "empty"
      ? Promise.resolve(([] as { entityId: string; _count: { _all: number } }[]))
      : prisma.entityComment.groupBy({
          by: ["entityId"],
          where: commentWhere,
          _count: { _all: true },
        });

  const [partGroups, saveGroups, commentGroups] = await Promise.all([
    prisma.eventParticipation.groupBy({
      by: ["eventId"],
      where: {
        createdAt: { gte: since },
        event: eventScope,
      },
      _count: { _all: true },
    }),
    prisma.savedEvent.groupBy({
      by: ["eventId"],
      where: {
        createdAt: { gte: since },
        event: eventScope,
      },
      _count: { _all: true },
    }),
    commentGroupsPromise,
  ]);

  const validCommentEventIds = new Set<string>();
  if (commentGroups.length > 0 && eventCommentScope.mode === "global") {
    const ids = commentGroups.map((g) => g.entityId);
    const valid = await prisma.event.findMany({
      where: buildPublicEventWhere({
        id: { in: ids },
        startsAt: { gte: now },
        ...(args.cityIds?.length ? { cityId: { in: args.cityIds } } : {}),
      }),
      select: { id: true },
    });
    for (const e of valid) {
      validCommentEventIds.add(e.id);
    }
  }

  const scores = new Map<
    string,
    { participation: number; comments: number; saved: number }
  >();

  const bump = (
    id: string,
    key: "participation" | "comments" | "saved",
    n: number,
  ) => {
    const cur = scores.get(id) ?? { participation: 0, comments: 0, saved: 0 };
    cur[key] += n;
    scores.set(id, cur);
  };

  for (const g of partGroups) {
    bump(g.eventId, "participation", g._count._all);
  }
  for (const g of saveGroups) {
    bump(g.eventId, "saved", g._count._all);
  }
  const useScopedComments = eventCommentScope.mode === "in";
  for (const g of commentGroups) {
    if (useScopedComments || validCommentEventIds.has(g.entityId)) {
      bump(g.entityId, "comments", g._count._all);
    }
  }

  const ranked = [...scores.entries()]
    .map(([eventId, counts]) => ({
      eventId,
      total: counts.participation + counts.comments + counts.saved,
      counts,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);

  if (ranked.length === 0) {
    return [];
  }

  const events = await prisma.event.findMany({
    where: { id: { in: ranked.map((r) => r.eventId) } },
    select: {
      id: true,
      slug: true,
      title: true,
      startsAt: true,
      city: { select: { id: true, slug: true, nameDe: true, nameTr: true } },
    },
  });

  const eventById = new Map(events.map((e) => [e.id, e]));
  const out: TrendingEventDiscoveryRow[] = [];

  for (const r of ranked) {
    const e = eventById.get(r.eventId);
    if (!e) {
      continue;
    }
    out.push({
      id: e.id,
      slug: e.slug,
      title: e.title,
      cityLabel: getLocalizedCityDisplayName(args.locale, e.city),
      reason: pickEventDiscoveryReason(r.counts),
      startsAt: e.startsAt,
    });
  }

  return out;
}
