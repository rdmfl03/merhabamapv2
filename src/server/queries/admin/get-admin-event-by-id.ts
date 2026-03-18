import { prisma } from "@/lib/prisma";

export async function getAdminEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      moderationStatus: true,
      isPublished: true,
      aiReviewStatus: true,
      aiConfidenceScore: true,
      aiLastCheckedAt: true,
      venueName: true,
      organizerName: true,
      externalUrl: true,
      startsAt: true,
      endsAt: true,
      city: {
        select: {
          nameDe: true,
          nameTr: true,
        },
      },
      reports: {
        where: {
          targetType: "EVENT",
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          reason: true,
          createdAt: true,
        },
      },
    },
  });
}
