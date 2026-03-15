import type { Prisma } from "@prisma/client";

import { getBerlinDateFilter } from "@/lib/events";
import { prisma } from "@/lib/prisma";
import type { EventsFilterInput } from "@/lib/validators/events";

import { publicEventSelect, type PublicEventRecord } from "./shared";

export type ListedEvent = PublicEventRecord & {
  isSaved: boolean;
};

export async function listEvents(args: {
  filters: EventsFilterInput;
  userId?: string;
}) {
  const where: Prisma.EventWhereInput = {
    isPublished: true,
    moderationStatus: "APPROVED",
    startsAt: {
      gte: new Date(),
    },
  };

  if (args.filters.city) {
    where.city = {
      slug: args.filters.city,
    };
  }

  if (args.filters.category) {
    where.category = args.filters.category as Prisma.EventWhereInput["category"];
  }

  if (args.filters.q) {
    where.OR = [
      { title: { contains: args.filters.q, mode: "insensitive" } },
      { descriptionDe: { contains: args.filters.q, mode: "insensitive" } },
      { descriptionTr: { contains: args.filters.q, mode: "insensitive" } },
      { venueName: { contains: args.filters.q, mode: "insensitive" } },
      { addressLine1: { contains: args.filters.q, mode: "insensitive" } },
    ];
  }

  let events = await prisma.event.findMany({
    where,
    orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
    take: 36,
    select: publicEventSelect,
  });

  if (args.filters.date) {
    events = events.filter((event) =>
      getBerlinDateFilter(event.startsAt, args.filters.date!),
    );
  }

  if (!args.userId || events.length === 0) {
    return events.map((event) => ({ ...event, isSaved: false }));
  }

  const savedEvents = await prisma.savedEvent.findMany({
    where: {
      userId: args.userId,
      eventId: {
        in: events.map((event) => event.id),
      },
    },
    select: {
      eventId: true,
    },
  });

  const savedIds = new Set(savedEvents.map((entry) => entry.eventId));

  return events.map((event) => ({
    ...event,
    isSaved: savedIds.has(event.id),
  }));
}
