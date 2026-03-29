import { prisma } from "@/lib/prisma";

export async function listAdminPlaces() {
  return prisma.place.findMany({
    where: {
      isPublished: true,
      moderationStatus: "APPROVED",
    },
    orderBy: [{ verificationStatus: "desc" }, { updatedAt: "desc" }],
    take: 50,
    select: {
      id: true,
      slug: true,
      name: true,
      verificationStatus: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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
