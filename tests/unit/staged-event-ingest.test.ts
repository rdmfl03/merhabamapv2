import { randomUUID } from "node:crypto";

import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/audit/log-admin-action", () => ({
  logAdminAction: vi.fn(async () => {}),
}));

vi.mock("@/server/actions/admin/shared", () => ({
  requireAdminAccess: vi.fn(async () => ({ id: "admin-test-user" })),
}));

Object.assign(process.env, {
  NODE_ENV: "test",
  APP_ENV: "development",
  AUTH_SECRET: "12345678901234567890123456789012",
  APP_URL: "http://localhost:3000",
  DEFAULT_LOCALE: "de",
  AUTH_ENABLE_PASSWORD_LOGIN: "true",
  AUTH_DEMO_CREDENTIALS_ENABLED: "false",
  AUTH_ALLOW_CREDENTIALS_MOCK: "false",
  LOG_LEVEL: "debug",
  READINESS_ENABLE_DB_CHECK: "false",
  NEXT_PUBLIC_MAP_PROVIDER: "mapbox",
  NEXT_PUBLIC_ENABLE_DEV_DEMO_UI: "false",
  INGEST_SECRET: "merhabamap_ingest_secret_dev_2026",
});

const { prisma } = await import("@/lib/prisma");
const { POST: ingestEvent } = await import("@/app/api/ingest/event/route");
const { reviewNormalizedIngestEvent } = await import(
  "@/server/actions/admin/review-normalized-ingest-event"
);

const TEST_CITY_ID = "city-berlin-test";
const TEST_CITY_KOELN_ID = "city-koeln-test";
const TEST_ADMIN_ID = "admin-test-user";

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      admin_action_logs,
      submissions,
      normalized_ingest_events,
      raw_ingest_items,
      reports,
      saved_events,
      event_sources,
      events,
      cities,
      users
    RESTART IDENTITY CASCADE
  `);
}

async function seedBaseRecords() {
  await prisma.user.create({
    data: {
      id: TEST_ADMIN_ID,
      email: "admin@example.com",
      role: "ADMIN",
    },
  });

  await prisma.city.create({
    data: {
      id: TEST_CITY_ID,
      slug: "berlin",
      nameDe: "Berlin",
      nameTr: "Berlin",
      countryCode: "DE",
    },
  });

  await prisma.city.create({
    data: {
      id: TEST_CITY_KOELN_ID,
      slug: "koeln",
      nameDe: "Koeln",
      nameTr: "Koln",
      countryCode: "DE",
    },
  });
}

async function ingestPayload(
  title: string,
  startsAt?: string,
  overrides: Record<string, unknown> = {},
) {
  const request = new NextRequest("http://localhost:3000/api/ingest/event", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-ingest-secret": process.env.INGEST_SECRET ?? "",
    },
    body: JSON.stringify({
      title,
      description:
        "Ausfuehrliche Testbeschreibung fuer den staged ingest Ablauf mit genug Inhalt.",
      venueName: "Test Venue",
      citySlug: "berlin",
      sourceCategory: "community",
      sourceUrl: `https://example.com/events/${encodeURIComponent(title)}`,
      ...(startsAt ? { startsAt } : {}),
      ...overrides,
    }),
  });

  const response = await ingestEvent(request);
  const body = await response.json();

  return {
    status: response.status,
    body,
  };
}

async function submitReview(args: {
  normalizedIngestEventId: string;
  action: "PROMOTE" | "REJECT" | "MARK_DUPLICATE" | "MARK_STALE" | "MARK_SUPERSEDED";
  reviewNote?: string;
}) {
  const formData = new FormData();
  formData.set("locale", "de");
  formData.set("normalizedIngestEventId", args.normalizedIngestEventId);
  formData.set("action", args.action);

  if (args.reviewNote) {
    formData.set("reviewNote", args.reviewNote);
  }

  return reviewNormalizedIngestEvent(undefined, formData);
}

function buildTitle(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

describe("staged event ingest flow", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedBaseRecords();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("supports the happy path promotion and backfills submission linkage", async () => {
    const title = buildTitle("happy-path");
    const startsAt = "2026-04-02T18:00:00.000Z";

    const ingestResult = await ingestPayload(title, startsAt);

    expect(ingestResult.status).toBe(201);
    expect(ingestResult.body.productEventCreated).toBe(false);

    const submissionBefore = await prisma.submission.findUniqueOrThrow({
      where: { id: ingestResult.body.submissionId },
      select: {
        targetEntityId: true,
        normalizedIngestEventId: true,
        status: true,
      },
    });

    expect(submissionBefore.targetEntityId).toBeNull();
    expect(submissionBefore.normalizedIngestEventId).toBe(ingestResult.body.normalizedEventId);
    expect(submissionBefore.status).toBe("PENDING");

    const actionResult = await submitReview({
      normalizedIngestEventId: ingestResult.body.normalizedEventId,
      action: "PROMOTE",
      reviewNote: "Promote happy path test item",
    });

    expect(actionResult).toEqual({
      status: "success",
      message: "staged_ingest_event_promoted",
    });

    const normalizedEvent = await prisma.normalizedIngestEvent.findUniqueOrThrow({
      where: { id: ingestResult.body.normalizedEventId },
      select: {
        eventId: true,
        normalizationStatus: true,
        promotedAt: true,
      },
    });

    expect(normalizedEvent.normalizationStatus).toBe("PROMOTED");
    expect(normalizedEvent.eventId).toBeTruthy();
    expect(normalizedEvent.promotedAt).not.toBeNull();

    const submissionAfter = await prisma.submission.findUniqueOrThrow({
      where: { id: ingestResult.body.submissionId },
      select: {
        targetEntityId: true,
        normalizedIngestEventId: true,
        status: true,
      },
    });

    expect(submissionAfter.targetEntityId).toBe(normalizedEvent.eventId);
    expect(submissionAfter.normalizedIngestEventId).toBe(ingestResult.body.normalizedEventId);
    expect(submissionAfter.status).toBe("PENDING");

    const promotedEvent = await prisma.event.findUniqueOrThrow({
      where: { id: normalizedEvent.eventId ?? "" },
      select: {
        title: true,
        moderationStatus: true,
      },
    });

    expect(promotedEvent.title).toBe(title);
    expect(promotedEvent.moderationStatus).toBe("PENDING");
  });

  it("decodes HTML entities during staged event normalization", async () => {
    const startsAt = "2026-04-08T18:00:00.000Z";
    const ingestResult = await ingestPayload("TGD &#8211; Konzertabend &amp; Begegnung", startsAt);

    expect(ingestResult.status).toBe(201);

    const normalizedEvent = await prisma.normalizedIngestEvent.findUniqueOrThrow({
      where: { id: ingestResult.body.normalizedEventId },
      select: {
        title: true,
      },
    });

    expect(normalizedEvent.title).toBe("TGD – Konzertabend & Begegnung");

    const submission = await prisma.submission.findUniqueOrThrow({
      where: { id: ingestResult.body.submissionId },
      select: {
        payloadJson: true,
      },
    });

    expect(submission.payloadJson).toContain("TGD – Konzertabend & Begegnung");
  });

  it("infers startsAt, city and venue from raw candidate hints", async () => {
    const ingestResult = await ingestPayload("VIKZ Iftar Abend", undefined, {
      description: undefined,
      venueName: undefined,
      citySlug: undefined,
      cityGuess: "Köln",
      rawDatetimeText: "27.02.2026 19:15 Uhr",
      rawLocationText: "VIKZ Zentrale, Vogelsanger Straße 290, 50825 Köln",
      sourceCategory: "religious",
      sourceUrl: "https://vikz.de/de/iftar-abend",
    });

    expect(ingestResult.status).toBe(201);

    const normalizedEvent = await prisma.normalizedIngestEvent.findUniqueOrThrow({
      where: { id: ingestResult.body.normalizedEventId },
      select: {
        cityId: true,
        venueName: true,
        startsAt: true,
      },
    });

    expect(normalizedEvent.cityId).toBe(TEST_CITY_KOELN_ID);
    expect(normalizedEvent.venueName).toBe("VIKZ Zentrale, Vogelsanger Straße 290, 50825 Köln");
    expect(normalizedEvent.startsAt.toISOString()).toBe("2026-02-27T18:15:00.000Z");

    const rawItem = await prisma.rawIngestItem.findUniqueOrThrow({
      where: { id: ingestResult.body.rawIngestItemId },
      select: {
        rawDatetimeText: true,
        rawLocationText: true,
        cityGuess: true,
      },
    });

    expect(rawItem.rawDatetimeText).toBe("27.02.2026 19:15 Uhr");
    expect(rawItem.rawLocationText).toBe("VIKZ Zentrale, Vogelsanger Straße 290, 50825 Köln");
    expect(rawItem.cityGuess).toBe("Köln");
  });

  it("rejects staged events without creating product events and allows future re-ingest", async () => {
    const title = buildTitle("reject-path");
    const startsAt = "2026-04-03T18:00:00.000Z";
    const ingestResult = await ingestPayload(title, startsAt);

    expect(ingestResult.status).toBe(201);

    const reviewResult = await submitReview({
      normalizedIngestEventId: ingestResult.body.normalizedEventId,
      action: "REJECT",
      reviewNote: "Rejected test item",
    });

    expect(reviewResult).toEqual({
      status: "success",
      message: "staged_ingest_event_rejected",
    });

    const normalizedEvent = await prisma.normalizedIngestEvent.findUniqueOrThrow({
      where: { id: ingestResult.body.normalizedEventId },
      select: {
        eventId: true,
        normalizationStatus: true,
      },
    });

    expect(normalizedEvent.eventId).toBeNull();
    expect(normalizedEvent.normalizationStatus).toBe("REJECTED");
    expect(await prisma.event.count({ where: { title } })).toBe(0);

    const retryResult = await ingestPayload(title, startsAt);
    expect(retryResult.status).toBe(201);
  });

  it("marks staged events stale without creating product events and allows future re-ingest", async () => {
    const title = buildTitle("stale-path");
    const startsAt = "2026-04-04T18:00:00.000Z";
    const ingestResult = await ingestPayload(title, startsAt);

    const reviewResult = await submitReview({
      normalizedIngestEventId: ingestResult.body.normalizedEventId,
      action: "MARK_STALE",
      reviewNote: "Stale test item",
    });

    expect(reviewResult).toEqual({
      status: "success",
      message: "staged_ingest_event_marked_stale",
    });

    const normalizedEvent = await prisma.normalizedIngestEvent.findUniqueOrThrow({
      where: { id: ingestResult.body.normalizedEventId },
      select: {
        eventId: true,
        normalizationStatus: true,
      },
    });

    expect(normalizedEvent.eventId).toBeNull();
    expect(normalizedEvent.normalizationStatus).toBe("STALE");
    expect(await prisma.event.count({ where: { title } })).toBe(0);

    const retryResult = await ingestPayload(title, startsAt);
    expect(retryResult.status).toBe(201);
  });

  it("marks a staged event as duplicate when a canonical product event already exists", async () => {
    const title = buildTitle("duplicate-path");
    const startsAt = "2026-04-05T18:00:00.000Z";
    const ingestResult = await ingestPayload(title, startsAt);

    const canonicalEvent = await prisma.event.create({
      data: {
        slug: `canonical-${randomUUID().slice(0, 8)}`,
        title,
        descriptionDe: "Canonical event",
        descriptionTr: "Canonical event",
        category: "COMMUNITY",
        cityId: TEST_CITY_ID,
        venueName: "Canonical Venue",
        startsAt: new Date(startsAt),
        externalUrl: "https://example.com/canonical",
        moderationStatus: "PENDING",
        isPublished: false,
      },
      select: {
        id: true,
      },
    });

    const reviewResult = await submitReview({
      normalizedIngestEventId: ingestResult.body.normalizedEventId,
      action: "PROMOTE",
      reviewNote: "Should resolve as duplicate",
    });

    expect(reviewResult).toEqual({
      status: "success",
      message: "staged_ingest_event_marked_duplicate",
    });

    const normalizedEvent = await prisma.normalizedIngestEvent.findUniqueOrThrow({
      where: { id: ingestResult.body.normalizedEventId },
      select: {
        eventId: true,
        normalizationStatus: true,
      },
    });

    expect(normalizedEvent.eventId).toBeNull();
    expect(normalizedEvent.normalizationStatus).toBe("DUPLICATE");

    const submissions = await prisma.submission.findMany({
      where: {
        normalizedIngestEventId: ingestResult.body.normalizedEventId,
      },
      select: {
        targetEntityId: true,
        status: true,
      },
    });

    expect(submissions).toEqual([
      {
        targetEntityId: canonicalEvent.id,
        status: "DONE",
      },
    ]);

    expect(
      await prisma.event.count({
        where: {
          title,
          cityId: TEST_CITY_ID,
          startsAt: new Date(startsAt),
        },
      }),
    ).toBe(1);
  });

  it("blocks ingest duplicates when title differences are only punctuation or casing", async () => {
    const startsAt = "2026-04-09T18:00:00.000Z";

    const firstIngest = await ingestPayload("TGD – Konzertabend", startsAt, {
      venueName: "Kulturhaus Berlin",
    });
    expect(firstIngest.status).toBe(201);

    const secondIngest = await ingestPayload("tgd konzertabend", startsAt, {
      venueName: "Kulturhaus Berlin",
    });

    expect(secondIngest.status).toBe(409);
    expect(secondIngest.body.normalizedEventId).toBe(firstIngest.body.normalizedEventId);
  });

  it("treats nearby startsAt values as duplicate when title and venue both match after normalization", async () => {
    const ingestResult = await ingestPayload("TGD – Konzertabend", "2026-04-10T18:00:00.000Z", {
      venueName: "Kulturhaus Berlin",
    });

    const canonicalEvent = await prisma.event.create({
      data: {
        slug: `canonical-nearby-${randomUUID().slice(0, 8)}`,
        title: "tgd konzertabend",
        descriptionDe: "Canonical event",
        descriptionTr: "Canonical event",
        category: "COMMUNITY",
        cityId: TEST_CITY_ID,
        venueName: "Kulturhaus Berlin",
        startsAt: new Date("2026-04-10T19:00:00.000Z"),
        externalUrl: "https://example.com/canonical-nearby",
        moderationStatus: "PENDING",
        isPublished: false,
      },
      select: {
        id: true,
      },
    });

    const reviewResult = await submitReview({
      normalizedIngestEventId: ingestResult.body.normalizedEventId,
      action: "PROMOTE",
      reviewNote: "Should resolve as nearby duplicate",
    });

    expect(reviewResult).toEqual({
      status: "success",
      message: "staged_ingest_event_marked_duplicate",
    });

    const submission = await prisma.submission.findUniqueOrThrow({
      where: { id: ingestResult.body.submissionId },
      select: {
        targetEntityId: true,
        status: true,
      },
    });

    expect(submission).toEqual({
      targetEntityId: canonicalEvent.id,
      status: "DONE",
    });

    expect(
      await prisma.event.count({
        where: {
          cityId: TEST_CITY_ID,
        },
      }),
    ).toBe(1);
  });

  it("stays conservative for nearby events when venue context differs", async () => {
    const ingestResult = await ingestPayload("TGD – Konzertabend", "2026-04-11T18:00:00.000Z", {
      venueName: "Kulturhaus Berlin",
    });

    await prisma.event.create({
      data: {
        slug: `canonical-different-venue-${randomUUID().slice(0, 8)}`,
        title: "tgd konzertabend",
        descriptionDe: "Canonical event",
        descriptionTr: "Canonical event",
        category: "COMMUNITY",
        cityId: TEST_CITY_ID,
        venueName: "Anderer Saal Berlin",
        startsAt: new Date("2026-04-11T19:00:00.000Z"),
        externalUrl: "https://example.com/canonical-different-venue",
        moderationStatus: "PENDING",
        isPublished: false,
      },
    });

    const reviewResult = await submitReview({
      normalizedIngestEventId: ingestResult.body.normalizedEventId,
      action: "PROMOTE",
    });

    expect(reviewResult).toEqual({
      status: "success",
      message: "staged_ingest_event_promoted",
    });

    expect(
      await prisma.event.count({
        where: {
          cityId: TEST_CITY_ID,
        },
      }),
    ).toBe(2);
  });

  it("treats repeated promote attempts as a controlled no-op after promotion", async () => {
    const title = buildTitle("repeat-promote");
    const startsAt = "2026-04-06T18:00:00.000Z";
    const ingestResult = await ingestPayload(title, startsAt);

    const firstResult = await submitReview({
      normalizedIngestEventId: ingestResult.body.normalizedEventId,
      action: "PROMOTE",
    });
    const secondResult = await submitReview({
      normalizedIngestEventId: ingestResult.body.normalizedEventId,
      action: "PROMOTE",
    });

    expect(firstResult).toEqual({
      status: "success",
      message: "staged_ingest_event_promoted",
    });
    expect(secondResult).toEqual({
      status: "success",
      message: "staged_ingest_event_promoted",
    });

    expect(await prisma.event.count({ where: { title } })).toBe(1);
  });

  it("handles concurrent promotion attempts without creating inconsistent state", async () => {
    const title = buildTitle("concurrent-promote");
    const startsAt = "2026-04-07T18:00:00.000Z";
    const ingestResult = await ingestPayload(title, startsAt);

    const [left, right] = await Promise.allSettled([
      submitReview({
        normalizedIngestEventId: ingestResult.body.normalizedEventId,
        action: "PROMOTE",
        reviewNote: "left",
      }),
      submitReview({
        normalizedIngestEventId: ingestResult.body.normalizedEventId,
        action: "PROMOTE",
        reviewNote: "right",
      }),
    ]);

    expect(left.status).toBe("fulfilled");
    expect(right.status).toBe("fulfilled");

    const eventCount = await prisma.event.count({ where: { title } });
    expect(eventCount).toBe(1);

    const normalizedEvent = await prisma.normalizedIngestEvent.findUniqueOrThrow({
      where: { id: ingestResult.body.normalizedEventId },
      select: {
        eventId: true,
        normalizationStatus: true,
      },
    });

    expect(normalizedEvent.normalizationStatus).toBe("PROMOTED");
    expect(normalizedEvent.eventId).toBeTruthy();

    const linkedSubmission = await prisma.submission.findUniqueOrThrow({
      where: { id: ingestResult.body.submissionId },
      select: {
        targetEntityId: true,
        status: true,
      },
    });

    expect(linkedSubmission.targetEntityId).toBe(normalizedEvent.eventId);
    expect(linkedSubmission.status).toBe("PENDING");
  });
});
