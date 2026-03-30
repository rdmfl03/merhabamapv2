import {
  EntityContributionEntityType,
  EntityContributionRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Single CREATOR row for moderation / admin context (if any). */
export async function getCreatorEntityContribution(args: {
  entityType: EntityContributionEntityType;
  entityId: string;
}) {
  return prisma.entityContribution.findFirst({
    where: {
      entityType: args.entityType,
      entityId: args.entityId,
      role: EntityContributionRole.CREATOR,
    },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });
}
