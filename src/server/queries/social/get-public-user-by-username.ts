import { prisma } from "@/lib/prisma";

export async function getPublicUserByUsername(username: string) {
  const trimmed = username.trim();
  if (!trimmed) {
    return null;
  }

  return prisma.user.findFirst({
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
    },
  });
}
