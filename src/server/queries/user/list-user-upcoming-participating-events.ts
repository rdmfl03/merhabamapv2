import type { EventParticipationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ListedEvent } from "@/server/queries/events/list-events";
import { buildPublicEventWhere, publicEventSelect } from "@/server/queries/events/shared";

const TAKE = 48;

export type ParticipatingListedEvent = ListedEvent & {
  participationStatus: EventParticipationStatus;
};

export async function countUpcomingParticipatingEventsForUser(userId: string) {
  const now = new Date();
  return prisma.eventParticipation.count({
    where: {
      userId,
      event: buildPublicEventWhere({
        startsAt: { gte: now },
      }),
    },
  });
}

/**
 * Upcoming public events the viewer participates in (interested or going), soonest first.
 */
export async function listUserUpcomingParticipatingEvents(
  userId: string,
): Promise<ParticipatingListedEvent[]> {
  const now = new Date();

  const participations = await prisma.eventParticipation.findMany({
    where: {
      userId,
      event: buildPublicEventWhere({
        startsAt: { gte: now },
      }),
    },
    orderBy: { event: { startsAt: "asc" } },
    take: TAKE,
    select: {
      status: true,
      event: { select: publicEventSelect },
    },
  });

  if (participations.length === 0) {
    return [];
  }

  const events = participations.map((p) => p.event);

  const savedRows = await prisma.savedEvent.findMany({
    where: {
      userId,
      eventId: { in: events.map((e) => e.id) },
    },
    select: { eventId: true },
  });
  const savedSet = new Set(savedRows.map((s) => s.eventId));

  return participations.map((p) => ({
    ...p.event,
    isSaved: savedSet.has(p.event.id),
    participationStatus: p.status,
  }));
}
