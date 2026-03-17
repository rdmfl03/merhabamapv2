import { prisma } from "@/lib/prisma";

type CountRow = {
  count: number;
};

export async function getAdminOverview() {
  const [
    openReports,
    inReviewReports,
    pendingClaims,
    claimedPlaces,
    verifiedPlaces,
    eventAiReviewQueueCountRows,
    placeAiReviewQueueCountRows,
    allAiReviewQueueCountRows,
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
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS count
      FROM v_event_ai_review_queue
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS count
      FROM v_place_ai_review_queue
    `,
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::int AS count
      FROM v_ai_review_queue_all
    `,
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
    eventAiReviewQueueCount: eventAiReviewQueueCountRows[0]?.count ?? 0,
    placeAiReviewQueueCount: placeAiReviewQueueCountRows[0]?.count ?? 0,
    allAiReviewQueueCount: allAiReviewQueueCountRows[0]?.count ?? 0,
    recentActions,
  };
}
