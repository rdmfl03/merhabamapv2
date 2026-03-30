import type { PrismaClient } from "@prisma/client";
import {
  EntityContributionEntityType,
  EntityContributionRole,
} from "@prisma/client";

type EntityContributionClient = Pick<PrismaClient, "entityContribution">;

/**
 * Records authenticated user-facing CREATOR attribution (idempotent).
 * Do not call for ingest/system-created entities.
 */
export async function upsertCreatorEntityContribution(
  db: EntityContributionClient,
  args: {
    userId: string;
    entityType: EntityContributionEntityType;
    entityId: string;
  },
): Promise<void> {
  await db.entityContribution.upsert({
    where: {
      userId_entityType_entityId_role: {
        userId: args.userId,
        entityType: args.entityType,
        entityId: args.entityId,
        role: EntityContributionRole.CREATOR,
      },
    },
    create: {
      userId: args.userId,
      entityType: args.entityType,
      entityId: args.entityId,
      role: EntityContributionRole.CREATOR,
    },
    update: {},
  });
}
