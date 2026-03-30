import { prisma } from "@/lib/prisma";
import { buildPublicEventWhere } from "@/server/queries/events/shared";

/** Public, upcoming events the user marked interested or going. */
export async function countUserUpcomingParticipations(userId: string): Promise<number> {
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
