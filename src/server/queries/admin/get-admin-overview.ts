import { prisma } from "@/lib/prisma";

export async function getAdminOverview() {
  const [
    openReports,
    inReviewReports,
    pendingClaims,
    claimedPlaces,
    verifiedPlaces,
    recentActions,
  ] = await Promise.all([
    prisma.report.count({
      where: {
        status: "OPEN",
      },
    }),
    prisma.report.count({
      where: {
        status: "IN_REVIEW",
      },
    }),
    prisma.businessClaim.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.place.count({
      where: {
        verificationStatus: "CLAIMED",
      },
    }),
    prisma.place.count({
      where: {
        verificationStatus: "VERIFIED",
      },
    }),
    prisma.adminActionLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        actionType: true,
        summary: true,
        createdAt: true,
        targetType: true,
        targetId: true,
      },
    }),
  ]);

  return {
    openReports,
    inReviewReports,
    pendingClaims,
    claimedPlaces,
    verifiedPlaces,
    recentActions,
  };
}
