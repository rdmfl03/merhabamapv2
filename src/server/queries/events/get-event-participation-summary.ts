import type { EventParticipationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type EventParticipationSummary = {
  interestedCount: number;
  goingCount: number;
  viewerStatus: EventParticipationStatus | null;
};

export async function getEventParticipationSummary(
  eventId: string,
  viewerUserId: string | null,
): Promise<EventParticipationSummary> {
  const [grouped, viewerRow] = await Promise.all([
    prisma.eventParticipation.groupBy({
      by: ["status"],
      where: { eventId },
      _count: { id: true },
    }),
    viewerUserId
      ? prisma.eventParticipation.findUnique({
          where: {
            userId_eventId: {
              userId: viewerUserId,
              eventId,
            },
          },
          select: { status: true },
        })
      : Promise.resolve(null),
  ]);

  let interestedCount = 0;
  let goingCount = 0;
  for (const row of grouped) {
    if (row.status === "INTERESTED") {
      interestedCount = row._count.id;
    }
    if (row.status === "GOING") {
      goingCount = row._count.id;
    }
  }

  return {
    interestedCount,
    goingCount,
    viewerStatus: viewerRow?.status ?? null,
  };
}
