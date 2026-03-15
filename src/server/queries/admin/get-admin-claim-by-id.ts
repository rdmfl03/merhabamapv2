import { prisma } from "@/lib/prisma";

export async function getAdminClaimById(id: string) {
  return prisma.businessClaim.findUnique({
    where: { id },
    select: {
      id: true,
      claimantName: true,
      claimantEmail: true,
      claimantPhone: true,
      message: true,
      evidenceNotes: true,
      status: true,
      adminNotes: true,
      createdAt: true,
      updatedAt: true,
      reviewedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      place: {
        select: {
          id: true,
          slug: true,
          name: true,
          ownerUserId: true,
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
              nameDe: true,
              nameTr: true,
            },
          },
        },
      },
    },
  });
}
