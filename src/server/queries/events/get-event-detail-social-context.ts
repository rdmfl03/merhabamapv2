import { prisma } from "@/lib/prisma";

export type EventDetailSocialContext = {
  commentCount: number;
  saveCount: number;
  latestCommentAt: Date | null;
};

/** Aggregate public signals only — participation totals come from getEventParticipationSummary. */
export async function getEventDetailSocialContext(
  eventId: string,
): Promise<EventDetailSocialContext> {
  const commentWhere = {
    entityType: "event" as const,
    entityId: eventId,
    deletedAt: null,
  };

  const [commentCount, latestComment, saveCount] = await Promise.all([
    prisma.entityComment.count({ where: commentWhere }),
    prisma.entityComment.findFirst({
      where: commentWhere,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.savedEvent.count({ where: { eventId } }),
  ]);

  return {
    commentCount,
    saveCount,
    latestCommentAt: latestComment?.createdAt ?? null,
  };
}
