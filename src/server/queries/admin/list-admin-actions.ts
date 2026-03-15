import { prisma } from "@/lib/prisma";

export async function listAdminActions() {
  return prisma.adminActionLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    select: {
      id: true,
      actionType: true,
      targetType: true,
      targetId: true,
      summary: true,
      createdAt: true,
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}
