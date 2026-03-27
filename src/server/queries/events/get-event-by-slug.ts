import { prisma } from "@/lib/prisma";

import { buildPublicEventWhere, publicEventDetailSelect } from "./shared";

export async function getEventBySlug(args: {
  slug: string;
  userId?: string;
}) {
  const event = await prisma.event.findFirst({
    where: buildPublicEventWhere({
      slug: args.slug,
    }),
    select: publicEventDetailSelect,
  });

  if (!event) {
    return null;
  }

  if (!args.userId) {
    return { ...event, isSaved: false };
  }

  const saved = await prisma.savedEvent.findUnique({
    where: {
      userId_eventId: {
        userId: args.userId,
        eventId: event.id,
      },
    },
    select: {
      id: true,
    },
  });

  return {
    ...event,
    isSaved: Boolean(saved),
  };
}
