import { prisma } from "@/lib/prisma";

export type PlaceDetailSocialContext = {
  commentCount: number;
  saveCount: number;
  publicListCount: number;
  latestCommentAt: Date | null;
};

/** Aggregate public signals only — no per-user exposure. */
export async function getPlaceDetailSocialContext(
  placeId: string,
): Promise<PlaceDetailSocialContext> {
  const commentWhere = {
    entityType: "place" as const,
    entityId: placeId,
    deletedAt: null,
  };

  const [commentCount, latestComment, saveCount, publicListCount] = await Promise.all([
    prisma.entityComment.count({ where: commentWhere }),
    prisma.entityComment.findFirst({
      where: commentWhere,
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.savedPlace.count({ where: { placeId } }),
    prisma.placeCollectionItem.count({
      where: {
        placeId,
        collection: { visibility: "PUBLIC" },
      },
    }),
  ]);

  return {
    commentCount,
    saveCount,
    publicListCount,
    latestCommentAt: latestComment?.createdAt ?? null,
  };
}
