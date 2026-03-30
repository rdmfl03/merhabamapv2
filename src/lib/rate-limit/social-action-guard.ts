import "server-only";

import { prisma } from "@/lib/prisma";
import { ACTIVITY_ENTITY, ACTIVITY_TYPE } from "@/lib/social/activity-types";

function windowStart(windowMs: number) {
  return new Date(Date.now() - windowMs);
}

/** Max comments per user in sliding window (all entities). */
const COMMENT_WINDOW_MS = 10 * 60 * 1000;
const COMMENT_CAP = 22;

/** Same text on same entity within this window is rejected. */
const COMMENT_DUPLICATE_WINDOW_MS = 40 * 60 * 1000;

/** New follow relationships created in this window (re-follow after unfollow counts). */
const FOLLOW_BURST_WINDOW_MS = 2 * 60 * 1000;
const FOLLOW_BURST_CAP = 28;

const CITY_FOLLOW_BURST_WINDOW_MS = 2 * 60 * 1000;
const CITY_FOLLOW_BURST_CAP = 32;

const PARTICIPATION_ACTIVITY_WINDOW_MS = 60 * 1000;
const PARTICIPATION_ACTIVITY_CAP = 20;
const PARTICIPATION_PER_EVENT_WINDOW_MS = 45 * 1000;
const PARTICIPATION_PER_EVENT_CAP = 7;

const COLLECTION_CREATE_HOUR_MS = 60 * 60 * 1000;
const COLLECTION_CREATE_HOUR_CAP = 6;
const COLLECTION_CREATE_DAY_MS = 24 * 60 * 60 * 1000;
const COLLECTION_CREATE_DAY_CAP = 18;

const COLLECTION_TITLE_DUPLICATE_WINDOW_MS = 60 * 60 * 1000;

const COLLECTION_ITEM_ADD_WINDOW_MS = 10 * 60 * 1000;
const COLLECTION_ITEM_ADD_CAP = 48;

function normalizeCommentText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export async function getEntityCommentGuard(args: {
  userId: string;
  entityType: string;
  entityId: string;
  content: string;
}): Promise<"comment_rate_limited" | "comment_duplicate" | null> {
  const recentTotal = await prisma.entityComment.count({
    where: {
      userId: args.userId,
      deletedAt: null,
      createdAt: { gte: windowStart(COMMENT_WINDOW_MS) },
    },
  });

  if (recentTotal >= COMMENT_CAP) {
    return "comment_rate_limited";
  }

  const normalized = normalizeCommentText(args.content);
  if (!normalized) {
    return null;
  }

  const recentOnEntity = await prisma.entityComment.findMany({
    where: {
      userId: args.userId,
      entityType: args.entityType,
      entityId: args.entityId,
      deletedAt: null,
      createdAt: { gte: windowStart(COMMENT_DUPLICATE_WINDOW_MS) },
    },
    select: { content: true },
    take: 24,
  });

  for (const row of recentOnEntity) {
    if (normalizeCommentText(row.content) === normalized) {
      return "comment_duplicate";
    }
  }

  return null;
}

export async function getUserFollowCreateGuard(userId: string): Promise<"follow_rate_limited" | null> {
  const n = await prisma.follow.count({
    where: {
      followerId: userId,
      createdAt: { gte: windowStart(FOLLOW_BURST_WINDOW_MS) },
    },
  });

  if (n >= FOLLOW_BURST_CAP) {
    return "follow_rate_limited";
  }

  return null;
}

export async function getCityFollowToggleGuard(userId: string): Promise<"city_follow_rate_limited" | null> {
  const n = await prisma.cityFollow.count({
    where: {
      userId,
      createdAt: { gte: windowStart(CITY_FOLLOW_BURST_WINDOW_MS) },
    },
  });

  if (n >= CITY_FOLLOW_BURST_CAP) {
    return "city_follow_rate_limited";
  }

  return null;
}

export async function getEventParticipationToggleGuard(args: {
  userId: string;
  eventId: string;
}): Promise<"participation_rate_limited" | null> {
  const activityN = await prisma.activity.count({
    where: {
      userId: args.userId,
      type: { in: [ACTIVITY_TYPE.EVENT_INTERESTED, ACTIVITY_TYPE.EVENT_GOING] },
      createdAt: { gte: windowStart(PARTICIPATION_ACTIVITY_WINDOW_MS) },
    },
  });

  if (activityN >= PARTICIPATION_ACTIVITY_CAP) {
    return "participation_rate_limited";
  }

  const perEventN = await prisma.activity.count({
    where: {
      userId: args.userId,
      entityId: args.eventId,
      entityType: ACTIVITY_ENTITY.event,
      type: { in: [ACTIVITY_TYPE.EVENT_INTERESTED, ACTIVITY_TYPE.EVENT_GOING] },
      createdAt: { gte: windowStart(PARTICIPATION_PER_EVENT_WINDOW_MS) },
    },
  });

  if (perEventN >= PARTICIPATION_PER_EVENT_CAP) {
    return "participation_rate_limited";
  }

  return null;
}

export async function getPlaceCollectionCreateGuard(args: {
  userId: string;
  title: string;
}): Promise<"collection_create_rate_limited" | "collection_duplicate_title" | null> {
  const trimmed = args.title.trim();
  if (!trimmed) {
    return null;
  }

  const hourCount = await prisma.placeCollection.count({
    where: {
      userId: args.userId,
      createdAt: { gte: windowStart(COLLECTION_CREATE_HOUR_MS) },
    },
  });

  if (hourCount >= COLLECTION_CREATE_HOUR_CAP) {
    return "collection_create_rate_limited";
  }

  const dayCount = await prisma.placeCollection.count({
    where: {
      userId: args.userId,
      createdAt: { gte: windowStart(COLLECTION_CREATE_DAY_MS) },
    },
  });

  if (dayCount >= COLLECTION_CREATE_DAY_CAP) {
    return "collection_create_rate_limited";
  }

  const dupTitle = await prisma.placeCollection.findFirst({
    where: {
      userId: args.userId,
      title: trimmed,
      createdAt: { gte: windowStart(COLLECTION_TITLE_DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });

  if (dupTitle) {
    return "collection_duplicate_title";
  }

  return null;
}

export async function getPlaceCollectionItemAddGuard(userId: string): Promise<"collection_item_rate_limited" | null> {
  const n = await prisma.placeCollectionItem.count({
    where: {
      createdAt: { gte: windowStart(COLLECTION_ITEM_ADD_WINDOW_MS) },
      collection: { userId },
    },
  });

  if (n >= COLLECTION_ITEM_ADD_CAP) {
    return "collection_item_rate_limited";
  }

  return null;
}
