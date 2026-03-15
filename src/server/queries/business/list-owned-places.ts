import { prisma } from "@/lib/prisma";

export async function listOwnedPlaces(userId: string) {
  return prisma.place.findMany({
    where: {
      ownerUserId: userId,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      phone: true,
      websiteUrl: true,
      verificationStatus: true,
      moderationStatus: true,
      lastBusinessUpdateAt: true,
      city: {
        select: {
          slug: true,
          nameDe: true,
          nameTr: true,
        },
      },
    },
  });
}
