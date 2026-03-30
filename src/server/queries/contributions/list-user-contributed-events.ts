import {
  EntityContributionEntityType,
  EntityContributionRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 30;

export type ContributedEventRow = {
  id: string;
  slug: string;
  title: string;
};

export async function listUserContributedEvents(
  userId: string,
  limit = DEFAULT_LIMIT,
): Promise<ContributedEventRow[]> {
  const contributions = await prisma.entityContribution.findMany({
    where: {
      userId,
      entityType: EntityContributionEntityType.EVENT,
      role: EntityContributionRole.CREATOR,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { entityId: true },
  });

  const ids = contributions.map((c) => c.entityId);
  if (ids.length === 0) {
    return [];
  }

  const events = await prisma.event.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true, title: true },
  });

  const rank = new Map(ids.map((id, i) => [id, i]));
  return events
    .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
    .map((e) => ({ id: e.id, slug: e.slug, title: e.title }));
}
