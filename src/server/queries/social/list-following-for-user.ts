import { prisma } from "@/lib/prisma";

export async function listFollowingForUser(userId: string) {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      following: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  return rows
    .map((r) => r.following)
    .filter((u): u is { id: string; username: string | null; name: string | null } =>
      Boolean(u.username),
    );
}

export async function isFollowing(followerId: string, followingUserId: string) {
  const row = await prisma.follow.findUnique({
    where: {
      followerId_followingUserId: {
        followerId,
        followingUserId,
      },
    },
    select: { id: true },
  });
  return Boolean(row);
}
