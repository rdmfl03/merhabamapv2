import { prisma } from "@/lib/prisma";

export async function getAdminOverview() {
  const [openReports, pendingClaims, recentActions] = await Promise.all([
    prisma.report.count({
      where: {
        status: "OPEN",
      },
    }),
    prisma.businessClaim.count({
      where: {
        status: "PENDING",
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
    pendingClaims,
    recentActions,
  };
}
