import {
  EntityContributionEntityType,
  EntityContributionRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 30;

export type ContributedPlaceRow = {
  id: string;
  slug: string;
  name: string;
};

export async function listUserContributedPlaces(
  userId: string,
  limit = DEFAULT_LIMIT,
): Promise<ContributedPlaceRow[]> {
  const contributions = await prisma.entityContribution.findMany({
    where: {
      userId,
      entityType: EntityContributionEntityType.PLACE,
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

  const places = await prisma.place.findMany({
    where: { id: { in: ids } },
    select: { id: true, slug: true, name: true },
  });

  const rank = new Map(ids.map((id, i) => [id, i]));
  return places
    .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0))
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name }));
}
