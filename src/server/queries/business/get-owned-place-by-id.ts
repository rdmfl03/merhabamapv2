import { prisma } from "@/lib/prisma";

export async function getOwnedPlaceById(placeId: string, userId: string) {
  return prisma.place.findFirst({
    where: {
      id: placeId,
      ownerUserId: userId,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      descriptionDe: true,
      descriptionTr: true,
      phone: true,
      websiteUrl: true,
      openingHoursJson: true,
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
