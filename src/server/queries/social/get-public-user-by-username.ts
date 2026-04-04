import { prisma } from "@/lib/prisma";

export type GetPublicUserByUsernameOptions = {
  viewerUserId?: string | null;
};

/** Full profile (owner or public). When `limitedForPrivateViewer` is true, only header + stats + bio apply. */
export type PublicUserProfile = {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  limitedForPrivateViewer: boolean;
};

export async function getPublicUserByUsername(
  username: string,
  options?: GetPublicUserByUsernameOptions,
): Promise<PublicUserProfile | null> {
  const trimmed = username.trim();
  if (!trimmed) {
    return null;
  }

  const row = await prisma.user.findFirst({
    where: {
      AND: [
        { username: { not: null } },
        { username: { equals: trimmed, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      profileBio: true,
      profileVisibility: true,
    },
  });

  if (!row?.username) {
    return null;
  }

  const viewerId = options?.viewerUserId ?? null;
  const isOwner = viewerId != null && row.id === viewerId;
  const limitedForPrivateViewer = row.profileVisibility === "PRIVATE" && !isOwner;

  return {
    id: row.id,
    username: row.username,
    name: row.name,
    image: row.image,
    bio: row.profileBio,
    limitedForPrivateViewer,
  };
}
