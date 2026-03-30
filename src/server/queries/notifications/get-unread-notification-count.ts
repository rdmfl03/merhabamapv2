import { prisma } from "@/lib/prisma";

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}
