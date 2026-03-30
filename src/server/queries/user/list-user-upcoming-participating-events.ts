import { prisma } from "@/lib/prisma";
import { buildPublicEventWhere, publicEventSelect } from "@/server/queries/events/shared";

const TAKE = 48;

/**
 * Upcoming public events the viewer participates in (interested or going), soonest first.
 */
export async function listUserUpcomingParticipatingEvents(userId: string) {
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
      event: { select: publicEventSelect },
    },
  });

  const events = participations.map((p) => p.event);
  if (events.length === 0) {
    return [];
  }

  const savedRows = await prisma.savedEvent.findMany({
    where: {
      userId,
      eventId: { in: events.map((e) => e.id) },
    },
    select: { eventId: true },
  });
  const savedSet = new Set(savedRows.map((s) => s.eventId));

  return events.map((event) => ({
    ...event,
    isSaved: savedSet.has(event.id),
  }));
}
