import { prisma } from "@/lib/prisma";
import { getLinkedSubmissionContext } from "@/server/queries/admin/get-linked-submission-context";

export async function getAdminPlaceById(id: string) {
  const place = await prisma.place.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      name: true,
      isPublished: true,
      verificationStatus: true,
      moderationStatus: true,
      aiReviewStatus: true,
      aiConfidenceScore: true,
      aiLastCheckedAt: true,
      phone: true,
      websiteUrl: true,
      lastBusinessUpdateAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      verifiedAt: true,
      verifiedBy: {
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
      claims: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          claimantName: true,
          claimantEmail: true,
          createdAt: true,
        },
      },
    },
  });

  if (!place) {
    return null;
  }

  const submissionContext = await getLinkedSubmissionContext("PLACE", place.id);

  return {
    ...place,
    submissionContext,
  };
}
