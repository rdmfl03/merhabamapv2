import type { Prisma, ReportStatus, ReportTargetType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listAdminReports(filters?: {
  status?: ReportStatus;
  targetType?: ReportTargetType;
}) {
  const where: Prisma.ReportWhereInput = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.targetType) {
    where.targetType = filters.targetType;
  }

  return prisma.report.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      targetType: true,
      reason: true,
      status: true,
      createdAt: true,
      place: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });
}
