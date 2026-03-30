import {
  EntityContributionEntityType,
  EntityContributionRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Explicit recipients for COMMENT_ON_MY_CONTENT on a place: registered owner plus
 * the earliest CREATOR EntityContribution (if any). Deduped; excludes actor.
 */
export async function resolvePlaceCommentNotificationRecipientIds(args: {
  placeId: string;
  ownerUserId: string | null;
  actorUserId: string;
}): Promise<string[]> {
  const ids = new Set<string>();

  if (args.ownerUserId && args.ownerUserId !== args.actorUserId) {
    ids.add(args.ownerUserId);
  }

  const primaryCreator = await prisma.entityContribution.findFirst({
    where: {
      entityType: EntityContributionEntityType.PLACE,
      entityId: args.placeId,
      role: EntityContributionRole.CREATOR,
    },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });

  if (primaryCreator && primaryCreator.userId !== args.actorUserId) {
    ids.add(primaryCreator.userId);
  }

  return [...ids];
}

/**
 * Event comments: only the earliest explicit CREATOR contribution (no ingest inference).
 */
export async function resolveEventCommentNotificationRecipientIds(args: {
  eventId: string;
  actorUserId: string;
}): Promise<string[]> {
  const primaryCreator = await prisma.entityContribution.findFirst({
    where: {
      entityType: EntityContributionEntityType.EVENT,
      entityId: args.eventId,
      role: EntityContributionRole.CREATOR,
    },
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });

  if (!primaryCreator || primaryCreator.userId === args.actorUserId) {
    return [];
  }

  return [primaryCreator.userId];
}
