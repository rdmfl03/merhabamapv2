import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type NotificationListRow = {
  id: string;
  type: NotificationType;
  createdAt: Date;
  readAt: Date | null;
  actor: {
    id: string;
    username: string | null;
    name: string | null;
  } | null;
  entityType: string | null;
  entityId: string | null;
  /** Resolved for comment notifications */
  placeSlug: string | null;
  eventSlug: string | null;
};

const PAGE_SIZE = 50;

export async function listNotificationsForUser(userId: string): Promise<NotificationListRow[]> {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    select: {
      id: true,
      type: true,
      createdAt: true,
      readAt: true,
      entityType: true,
      entityId: true,
      actor: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  const placeIds = rows
    .filter((r) => r.type === "COMMENT_ON_MY_CONTENT" && r.entityType === "place" && r.entityId)
    .map((r) => r.entityId as string);

  const eventIds = rows
    .filter((r) => r.type === "COMMENT_ON_MY_CONTENT" && r.entityType === "event" && r.entityId)
    .map((r) => r.entityId as string);

  const slugByPlaceId = new Map<string, string>();
  if (placeIds.length > 0) {
    const places = await prisma.place.findMany({
      where: { id: { in: [...new Set(placeIds)] } },
      select: { id: true, slug: true },
    });
    for (const p of places) {
      slugByPlaceId.set(p.id, p.slug);
    }
  }

  const slugByEventId = new Map<string, string>();
  if (eventIds.length > 0) {
    const events = await prisma.event.findMany({
      where: { id: { in: [...new Set(eventIds)] } },
      select: { id: true, slug: true },
    });
    for (const e of events) {
      slugByEventId.set(e.id, e.slug);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    createdAt: r.createdAt,
    readAt: r.readAt,
    actor: r.actor,
    entityType: r.entityType,
    entityId: r.entityId,
    placeSlug:
      r.entityType === "place" && r.entityId ? (slugByPlaceId.get(r.entityId) ?? null) : null,
    eventSlug:
      r.entityType === "event" && r.entityId ? (slugByEventId.get(r.entityId) ?? null) : null,
  }));
}
