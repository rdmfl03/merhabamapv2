import {
  EntityContributionEntityType,
  EntityContributionRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function countUserEntityContributions(userId: string): Promise<{
  places: number;
  events: number;
}> {
  const [places, events] = await Promise.all([
    prisma.entityContribution.count({
      where: {
        userId,
        entityType: EntityContributionEntityType.PLACE,
        role: EntityContributionRole.CREATOR,
      },
    }),
    prisma.entityContribution.count({
      where: {
        userId,
        entityType: EntityContributionEntityType.EVENT,
        role: EntityContributionRole.CREATOR,
      },
    }),
  ]);

  return { places, events };
}
