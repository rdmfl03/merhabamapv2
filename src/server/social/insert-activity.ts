import type { PrismaClient } from "@prisma/client";

export type InsertActivityInput = {
  userId?: string | null;
  type: string;
  entityType: string;
  entityId?: string | null;
};

type ActivityDb = Pick<PrismaClient, "activity">;

export async function insertActivity(db: ActivityDb, input: InsertActivityInput) {
  await db.activity.create({
    data: {
      type: input.type,
      entityType: input.entityType,
      userId: input.userId ?? null,
      entityId: input.entityId ?? null,
    },
  });
}
