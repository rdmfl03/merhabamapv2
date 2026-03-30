import { prisma } from "@/lib/prisma";

const FOLLOW_LIST_PAGE_SIZE = 50;

export type FollowListUserRow = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  /** Viewer follows this user (only when viewer is logged in). */
  viewerFollows: boolean;
  /** Listed user is the current viewer. */
  isViewer: boolean;
};

export type FollowListPageResult = {
  total: number;
  users: FollowListUserRow[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export async function getFollowerCount(targetUserId: string): Promise<number> {
  return prisma.follow.count({
    where: { followingUserId: targetUserId },
  });
}

export async function getFollowingCount(targetUserId: string): Promise<number> {
  return prisma.follow.count({
    where: { followerId: targetUserId },
  });
}

function mapFollowEdgesToRows(
  edges: Array<{ user: { id: string; username: string | null; name: string | null; image: string | null } }>,
  viewerId: string | null,
  viewerFollowsIds: Set<string>,
): FollowListUserRow[] {
  return edges
    .map((e) => e.user)
    .filter((u): u is typeof u & { username: string } => Boolean(u.username))
    .map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      image: u.image,
      viewerFollows: viewerId ? viewerFollowsIds.has(u.id) : false,
      isViewer: viewerId === u.id,
    }));
}

export async function listFollowersPage(
  targetUserId: string,
  viewerId: string | null,
  page: number,
): Promise<FollowListPageResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const skip = (safePage - 1) * FOLLOW_LIST_PAGE_SIZE;

  const [total, rows] = await prisma.$transaction([
    prisma.follow.count({ where: { followingUserId: targetUserId } }),
    prisma.follow.findMany({
      where: { followingUserId: targetUserId },
      orderBy: { createdAt: "desc" },
      skip,
      take: FOLLOW_LIST_PAGE_SIZE,
      select: {
        follower: {
          select: { id: true, username: true, name: true, image: true },
        },
      },
    }),
  ]);

  const edges = rows.map((r) => ({ user: r.follower }));
  const listedIds = edges
    .map((e) => e.user)
    .filter((u) => u.username)
    .map((u) => u.id);

  let viewerFollowsIds = new Set<string>();
  if (viewerId && listedIds.length > 0) {
    const vf = await prisma.follow.findMany({
      where: {
        followerId: viewerId,
        followingUserId: { in: listedIds },
      },
      select: { followingUserId: true },
    });
    viewerFollowsIds = new Set(vf.map((x) => x.followingUserId));
  }

  const users = mapFollowEdgesToRows(edges, viewerId, viewerFollowsIds);
  const hasMore = skip + users.length < total;

  return {
    total,
    users,
    page: safePage,
    pageSize: FOLLOW_LIST_PAGE_SIZE,
    hasMore,
  };
}

export async function listFollowingPage(
  targetUserId: string,
  viewerId: string | null,
  page: number,
): Promise<FollowListPageResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const skip = (safePage - 1) * FOLLOW_LIST_PAGE_SIZE;

  const [total, rows] = await prisma.$transaction([
    prisma.follow.count({ where: { followerId: targetUserId } }),
    prisma.follow.findMany({
      where: { followerId: targetUserId },
      orderBy: { createdAt: "desc" },
      skip,
      take: FOLLOW_LIST_PAGE_SIZE,
      select: {
        following: {
          select: { id: true, username: true, name: true, image: true },
        },
      },
    }),
  ]);

  const edges = rows.map((r) => ({ user: r.following }));
  const listedIds = edges
    .map((e) => e.user)
    .filter((u) => u.username)
    .map((u) => u.id);

  let viewerFollowsIds = new Set<string>();
  if (viewerId && listedIds.length > 0) {
    const vf = await prisma.follow.findMany({
      where: {
        followerId: viewerId,
        followingUserId: { in: listedIds },
      },
      select: { followingUserId: true },
    });
    viewerFollowsIds = new Set(vf.map((x) => x.followingUserId));
  }

  const users = mapFollowEdgesToRows(edges, viewerId, viewerFollowsIds);
  const hasMore = skip + users.length < total;

  return {
    total,
    users,
    page: safePage,
    pageSize: FOLLOW_LIST_PAGE_SIZE,
    hasMore,
  };
}
