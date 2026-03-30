import { prisma } from "@/lib/prisma";
import { buildPublicEventWhere } from "@/server/queries/events/shared";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

export type ReportableEntityComment = {
  id: string;
  content: string;
  entityType: string;
  entityId: string;
};

/**
 * Comment must exist, not soft-deleted, and target place/event must be publicly visible.
 */
export async function getReportableEntityComment(
  commentId: string,
): Promise<ReportableEntityComment | null> {
  const comment = await prisma.entityComment.findFirst({
    where: {
      id: commentId,
      deletedAt: null,
    },
    select: {
      id: true,
      content: true,
      entityType: true,
      entityId: true,
    },
  });

  if (!comment) {
    return null;
  }

  if (comment.entityType === "place") {
    const place = await prisma.place.findFirst({
      where: buildPublicPlaceWhere({ id: comment.entityId }),
      select: { id: true },
    });
    if (!place) {
      return null;
    }
  } else if (comment.entityType === "event") {
    const event = await prisma.event.findFirst({
      where: buildPublicEventWhere({ id: comment.entityId }),
      select: { id: true },
    });
    if (!event) {
      return null;
    }
  } else {
    return null;
  }

  return comment;
}
