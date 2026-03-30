import {
  EntityContributionEntityType,
  EntityContributionRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function hasCreatorEntityContributionForPlace(placeId: string): Promise<boolean> {
  const row = await prisma.entityContribution.findFirst({
    where: {
      entityType: EntityContributionEntityType.PLACE,
      entityId: placeId,
      role: EntityContributionRole.CREATOR,
    },
    select: { id: true },
  });
  return Boolean(row);
}

export async function hasCreatorEntityContributionForEvent(eventId: string): Promise<boolean> {
  const row = await prisma.entityContribution.findFirst({
    where: {
      entityType: EntityContributionEntityType.EVENT,
      entityId: eventId,
      role: EntityContributionRole.CREATOR,
    },
    select: { id: true },
  });
  return Boolean(row);
}
