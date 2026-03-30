import type { EventParticipationStatus } from "@prisma/client";

import { ACTIVITY_ENTITY, ACTIVITY_TYPE } from "@/lib/social/activity-types";
import { prisma } from "@/lib/prisma";

const PARTICIPATION_ACTIVITY_TYPES = [
  ACTIVITY_TYPE.EVENT_INTERESTED,
  ACTIVITY_TYPE.EVENT_GOING,
] as const;

export async function clearEventParticipationActivities(userId: string, eventId: string) {
  await prisma.activity.deleteMany({
    where: {
      userId,
      entityType: ACTIVITY_ENTITY.event,
      entityId: eventId,
      type: { in: [...PARTICIPATION_ACTIVITY_TYPES] },
    },
  });
}

export async function setEventParticipationActivity(
  userId: string,
  eventId: string,
  status: EventParticipationStatus,
) {
  await clearEventParticipationActivities(userId, eventId);
  const type =
    status === "INTERESTED" ? ACTIVITY_TYPE.EVENT_INTERESTED : ACTIVITY_TYPE.EVENT_GOING;
  await prisma.activity.create({
    data: {
      userId,
      type,
      entityType: ACTIVITY_ENTITY.event,
      entityId: eventId,
    },
  });
}
