import type { Prisma } from "@prisma/client";

import { getBerlinDateFilter } from "@/lib/events";
import { isSpecificListingCity } from "@/lib/listing-city-filter";
import { prisma } from "@/lib/prisma";
import type { EventsFilterInput } from "@/lib/validators/events";
import { compareByAiRanking } from "@/server/queries/ai-shared";

import {
  buildPublicEventWhere,
  publicEventSelectWithAi,
  type PublicEventRecord,
  type PublicEventRecordWithAi,
} from "./shared";

export type ListedEvent = PublicEventRecord & {
  isSaved: boolean;
};

function rankEvents(events: PublicEventRecordWithAi[]) {
  return [...events].sort((left, right) =>
    compareByAiRanking<PublicEventRecordWithAi>(left, right, (eventLeft, eventRight) => {
      const startsAtDiff = eventLeft.startsAt.getTime() - eventRight.startsAt.getTime();

      if (startsAtDiff !== 0) {
        return startsAtDiff;
      }

      return eventRight.createdAt.getTime() - eventLeft.createdAt.getTime();
    }),
  );
}

function stripEventAiFields(event: PublicEventRecordWithAi): PublicEventRecord {
  const { aiReviewStatus: _aiReviewStatus, aiConfidenceScore: _aiConfidenceScore, createdAt: _createdAt, ...publicEvent } =
    event;

  return publicEvent;
}

export async function listEvents(args: {
  filters: EventsFilterInput;
  userId?: string;
}) {
  const where: Prisma.EventWhereInput = {
    startsAt: {
      gte: new Date(),
    },
  };

  if (isSpecificListingCity(args.filters.city)) {
    where.city = {
      slug: args.filters.city,
    };
  }

  if (args.filters.categories?.length) {
    where.category = { in: args.filters.categories };
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

  const sort = args.filters.sort ?? "soonest";

  // Date filters run in memory after fetch; a small `take` drops matching rows that sort
  // after the first N by startsAt/createdAt (e.g. "this-month" events late in the month).
  const takeLimit = args.filters.date ? 2000 : 72;

  let events = await prisma.event.findMany({
    where: buildPublicEventWhere(where),
    orderBy:
      sort === "newest"
        ? [{ createdAt: "desc" }]
        : [{ startsAt: "asc" }, { createdAt: "desc" }],
    take: takeLimit,
    select: publicEventSelectWithAi,
  });

  if (args.filters.date) {
    events = events.filter((event) =>
      getBerlinDateFilter(event.startsAt, args.filters.date!),
    );
  }

  events =
    sort === "newest"
      ? [...events]
          .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
          .slice(0, 36)
      : rankEvents(events).slice(0, 36);

  if (!args.userId || events.length === 0) {
    return events.map((event) => ({ ...stripEventAiFields(event), isSaved: false }));
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
    ...stripEventAiFields(event),
    isSaved: savedIds.has(event.id),
  }));
}
