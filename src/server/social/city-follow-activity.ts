import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { ACTIVITY_ENTITY, ACTIVITY_TYPE } from "@/lib/social/activity-types";

type ActivityClient = Pick<PrismaClient, "activity">;

export async function recordCityFollowedActivity(
  userId: string,
  cityId: string,
  db: ActivityClient = prisma,
) {
  await db.activity.deleteMany({
    where: {
      userId,
      type: ACTIVITY_TYPE.CITY_FOLLOWED,
      entityType: ACTIVITY_ENTITY.city,
      entityId: cityId,
    },
  });
  await db.activity.create({
    data: {
      userId,
      type: ACTIVITY_TYPE.CITY_FOLLOWED,
      entityType: ACTIVITY_ENTITY.city,
      entityId: cityId,
    },
  });
}

export async function removeCityFollowedActivity(
  userId: string,
  cityId: string,
  db: ActivityClient = prisma,
) {
  await db.activity.deleteMany({
    where: {
      userId,
      type: ACTIVITY_TYPE.CITY_FOLLOWED,
      entityType: ACTIVITY_ENTITY.city,
      entityId: cityId,
    },
  });
}
