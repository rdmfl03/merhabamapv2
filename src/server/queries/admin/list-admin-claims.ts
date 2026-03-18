import type { ClaimStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listAdminClaims(filters?: { status?: ClaimStatus }) {
  const where: Prisma.BusinessClaimWhereInput = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  return prisma.businessClaim.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      claimantName: true,
      claimantEmail: true,
      status: true,
      createdAt: true,
      place: {
        select: {
          id: true,
          slug: true,
          name: true,
          verificationStatus: true,
          ownerUserId: true,
        },
      },
    },
  });
}
