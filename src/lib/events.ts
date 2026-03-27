import type { EventCategory, Locale } from "@prisma/client";
import { z } from "zod";

import { getGalleryMediaAssets, resolveEntityImage, type ResolvedEntityImage } from "@/lib/media";

type LocalizedText = {
  de?: string | null;
  tr?: string | null;
};

type EventMediaAssetLike = {
  id?: string | null;
  assetUrl: string;
  sourceProvider?: string | null;
  sourceUrl?: string | null;
  externalRef?: string | null;
  role: string;
  status: string;
  rightsStatus: string;
  attributionText?: string | null;
  attributionUrl?: string | null;
  altText?: string | null;
  sortOrder?: number | null;
  observedAt?: Date | null;
};

type EventImageStateLike = {
  imageUrl?: string | null;
  primaryImageAsset?: EventMediaAssetLike | null;
  fallbackImageAsset?: EventMediaAssetLike | null;
  mediaAssets?: EventMediaAssetLike[] | null;
};

export function getLocalizedEventText(
  value: LocalizedText,
  locale: Locale | "de" | "tr",
  fallback = "",
) {
  if (locale === "tr") {
    return value.tr ?? value.de ?? fallback;
  }

  return value.de ?? value.tr ?? fallback;
}

export function buildEventsPath(
  locale: "de" | "tr",
  filters?: { city?: string; category?: string; date?: string; q?: string; sort?: string },
) {
  const search = new URLSearchParams();

  if (filters?.city) search.set("city", filters.city);
  if (filters?.category) search.set("category", filters.category);
  if (filters?.date) search.set("date", filters.date);
  if (filters?.q) search.set("q", filters.q);
  if (filters?.sort) search.set("sort", filters.sort);

  const query = search.toString();

  return query ? `/${locale}/events?${query}` : `/${locale}/events`;
}

const berlinDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const berlinWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Berlin",
  weekday: "short",
});

export function getBerlinDateKey(date: Date) {
  return berlinDateFormatter.format(date);
}

export function getBerlinWeekday(date: Date) {
  return berlinWeekdayFormatter.format(date);
}

export function getBerlinDateFilter(date: Date, filter: "today" | "this-week" | "this-month" | "upcoming") {
  const now = new Date();
  const dateKey = getBerlinDateKey(date);
  const nowKey = getBerlinDateKey(now);

  if (filter === "upcoming") {
    return date >= now;
  }

  if (filter === "today") {
    return dateKey === nowKey;
  }

  const [year, month, day] = nowKey.split("-").map(Number);
  const nowAtMidday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = getBerlinWeekday(nowAtMidday);
  const offsetMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const weekOffset = offsetMap[weekday] ?? 0;
  const weekStart = new Date(nowAtMidday);
  weekStart.setUTCDate(nowAtMidday.getUTCDate() - weekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const dateAtMidday = new Date(
    Date.UTC(
      Number(dateKey.slice(0, 4)),
      Number(dateKey.slice(5, 7)) - 1,
      Number(dateKey.slice(8, 10)),
      12,
      0,
      0,
    ),
  );

  if (filter === "this-week") {
    return dateAtMidday >= weekStart && dateAtMidday <= weekEnd;
  }

  return (
    dateAtMidday.getUTCFullYear() === nowAtMidday.getUTCFullYear() &&
    dateAtMidday.getUTCMonth() === nowAtMidday.getUTCMonth()
  );
}

export function formatEventDateRange(
  locale: "de" | "tr",
  startsAt: Date,
  endsAt?: Date | null,
) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  });

  if (!endsAt) {
    return dateFormatter.format(startsAt);
  }

  const sameDay = getBerlinDateKey(startsAt) === getBerlinDateKey(endsAt);

  if (sameDay) {
    const startDate = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeZone: "Europe/Berlin",
    }).format(startsAt);
    const startTime = new Intl.DateTimeFormat(locale, {
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(startsAt);
    const endTime = new Intl.DateTimeFormat(locale, {
      timeStyle: "short",
      timeZone: "Europe/Berlin",
    }).format(endsAt);

    return `${startDate}, ${startTime} - ${endTime}`;
  }

  return `${dateFormatter.format(startsAt)} - ${dateFormatter.format(endsAt)}`;
}

export function formatEventDayBadge(locale: "de" | "tr", startsAt: Date) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    timeZone: "Europe/Berlin",
  }).format(startsAt);
}

export function getEventCategoryLabelKey(category: EventCategory) {
  return category.toLowerCase() as Lowercase<EventCategory>;
}

export function getSafeExternalUrl(value: string | null | undefined) {
  const parsed = z.string().url().safeParse(value);

  if (!parsed.success) {
    return null;
  }

  try {
    const url = new URL(parsed.data);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function resolveEventImage(event: EventImageStateLike): ResolvedEntityImage | null {
  return resolveEntityImage({
    primaryImageAsset: event.primaryImageAsset,
    fallbackImageAsset: event.fallbackImageAsset,
    legacyImageUrl: event.imageUrl ?? null,
  });
}

export function getEventGalleryImages(event: EventImageStateLike) {
  return getGalleryMediaAssets({
    mediaAssets: event.mediaAssets,
    primaryImageAsset: event.primaryImageAsset,
    fallbackImageAsset: event.fallbackImageAsset,
  });
}
