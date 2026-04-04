import { prisma } from "@/lib/prisma";
import { publicEventSelect } from "@/server/queries/events/shared";

export async function countSavedEventsForUser(userId: string) {
  return prisma.savedEvent.count({ where: { userId } });
}

export async function getSavedEvents(userId: string) {
  const saved = await prisma.savedEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      event: {
        select: publicEventSelect,
      },
    },
  });

  return saved.map((entry) => ({
    ...entry.event,
    isSaved: true,
  }));
}
