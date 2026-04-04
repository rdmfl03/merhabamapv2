import type { Prisma } from "@prisma/client";

import { isSpecificListingCity } from "@/lib/listing-city-filter";
import { prisma } from "@/lib/prisma";
import type { ListedEvent } from "@/server/queries/events/list-events";
import {
  buildPublicEventWhere,
  publicEventRecordForFlight,
  publicEventSelectWithAi,
  type PublicEventRecordWithAi,
} from "@/server/queries/events/shared";
import type { ListedPlace } from "@/server/queries/places/list-places";
import {
  buildPublicPlaceWhere,
  publicPlaceRecordForFlight,
  publicPlaceSelectWithAi,
  type PublicPlaceRecordWithAi,
} from "@/server/queries/places/shared";

/** Short queries avoid accidental full scans. */
const MIN_QUERY_LENGTH = 2;
const MAX_PLACES = 15;
const MAX_EVENTS = 15;

function placeTextOr(raw: string): Prisma.PlaceWhereInput {
  return {
    OR: [
      { name: { contains: raw, mode: "insensitive" } },
      { descriptionDe: { contains: raw, mode: "insensitive" } },
      { descriptionTr: { contains: raw, mode: "insensitive" } },
      { addressLine1: { contains: raw, mode: "insensitive" } },
    ],
  };
}

function eventTextOr(raw: string): Prisma.EventWhereInput {
  return {
    OR: [
      { title: { contains: raw, mode: "insensitive" } },
      { descriptionDe: { contains: raw, mode: "insensitive" } },
      { descriptionTr: { contains: raw, mode: "insensitive" } },
      { venueName: { contains: raw, mode: "insensitive" } },
      { addressLine1: { contains: raw, mode: "insensitive" } },
    ],
  };
}

export type PublicSearchResult = {
  normalizedQuery: string;
  places: ListedPlace[];
  events: ListedEvent[];
};

/**
 * Case-insensitive substring search over public places and upcoming public events.
 * Deterministic ordering: places by name, events by start time (soonest first).
 */
export async function searchPublicPlacesAndEvents(args: {
  q: string;
  citySlug?: string | null;
  viewerUserId: string | null;
}): Promise<PublicSearchResult> {
  const normalizedQuery = args.q.trim();

  if (normalizedQuery.length < MIN_QUERY_LENGTH) {
    return { normalizedQuery, places: [], events: [] };
  }

  const raw = normalizedQuery;
  const now = new Date();

  const citySlug = args.citySlug;
  const placeCityExtra: Prisma.PlaceWhereInput[] =
    isSpecificListingCity(citySlug ?? undefined) && citySlug != null
      ? [{ city: { slug: citySlug } }]
      : [];

  const placeWhere = buildPublicPlaceWhere({
    AND: [placeTextOr(raw), ...placeCityExtra],
  });

  const eventCityExtra: Prisma.EventWhereInput[] =
    isSpecificListingCity(citySlug ?? undefined) && citySlug != null
      ? [{ city: { slug: citySlug } }]
      : [];

  const eventWhere = buildPublicEventWhere({
    startsAt: { gte: now },
    AND: [eventTextOr(raw), ...eventCityExtra],
  });

  const [placeRows, eventRows] = await Promise.all([
    prisma.place.findMany({
      where: placeWhere,
      orderBy: [{ name: "asc" }],
      take: MAX_PLACES,
      select: publicPlaceSelectWithAi,
    }),
    prisma.event.findMany({
      where: eventWhere,
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      take: MAX_EVENTS,
      select: publicEventSelectWithAi,
    }),
  ]);

  const [places, events] = await Promise.all([
    mapPlacesWithSaved(placeRows, args.viewerUserId),
    mapEventsWithSaved(eventRows, args.viewerUserId),
  ]);

  return { normalizedQuery, places, events };
}

async function mapPlacesWithSaved(
  rows: PublicPlaceRecordWithAi[],
  userId: string | null,
): Promise<ListedPlace[]> {
  if (rows.length === 0) {
    return [];
  }
  if (!userId) {
    return rows.map((p) => publicPlaceRecordForFlight(p, false));
  }
  const saved = await prisma.savedPlace.findMany({
    where: { userId, placeId: { in: rows.map((p) => p.id) } },
    select: { placeId: true },
  });
  const savedIds = new Set(saved.map((s) => s.placeId));
  return rows.map((p) => publicPlaceRecordForFlight(p, savedIds.has(p.id)));
}

async function mapEventsWithSaved(
  rows: PublicEventRecordWithAi[],
  userId: string | null,
): Promise<ListedEvent[]> {
  if (rows.length === 0) {
    return [];
  }
  if (!userId) {
    return rows.map((e) => publicEventRecordForFlight(e, false));
  }
  const saved = await prisma.savedEvent.findMany({
    where: { userId, eventId: { in: rows.map((e) => e.id) } },
    select: { eventId: true },
  });
  const savedIds = new Set(saved.map((s) => s.eventId));
  return rows.map((e) => publicEventRecordForFlight(e, savedIds.has(e.id)));
}
