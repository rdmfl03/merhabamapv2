import { prisma } from "@/lib/prisma";

export type PublicCommentRow = {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  authorUsername: string | null;
  authorDisplayName: string | null;
};

export async function listEntityComments(
  entityType: "place" | "event",
  entityId: string,
): Promise<PublicCommentRow[]> {
  const rows = await prisma.entityComment.findMany({
    where: {
      entityType,
      entityId,
      deletedAt: null,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      userId: true,
      user: {
        select: {
          username: true,
          name: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.createdAt,
    authorId: row.userId,
    authorUsername: row.user.username,
    authorDisplayName: row.user.name?.trim() || null,
  }));
}
