import { NextRequest, NextResponse } from "next/server";
import type { EventCategory, NormalizedIngestEventStatus } from "@prisma/client";

import { env, isDevelopmentLike } from "@/lib/env";
import { handleServerError } from "@/lib/errors/handle-server-error";
import {
  findMatchingEventDuplicate,
  getEventDuplicateSearchWindow,
} from "@/lib/ingest/event-duplicates";
import { prisma } from "@/lib/prisma";
import { getSafeHttpUrl } from "@/lib/submissions";
import { ingestEventSchema } from "@/lib/validators/submissions";

export const dynamic = "force-dynamic";

const ACTIVE_NORMALIZED_INGEST_STATUSES: NormalizedIngestEventStatus[] = [
  "PENDING_REVIEW",
  "APPROVED_FOR_PROMOTION",
  "PROMOTED",
  "DUPLICATE",
];

const DEFAULT_INGEST_EVENT_CATEGORY: EventCategory = "COMMUNITY";
const INGEST_EVENT_CATEGORY_MAP: Record<string, EventCategory> = {
  concert: "CONCERT",
  music: "CONCERT",
  festival: "CULTURE",
  culture: "CULTURE",
  cultural: "CULTURE",
  student: "STUDENT",
  students: "STUDENT",
  community: "COMMUNITY",
  meetup: "COMMUNITY",
  family: "FAMILY",
  business: "BUSINESS",
  religious: "RELIGIOUS",
  religion: "RELIGIOUS",
};

const SUPPORTED_CITY_ALIASES: Record<string, "berlin" | "koeln"> = {
  berlin: "berlin",
  koeln: "koeln",
  koln: "koeln",
  "köln": "koeln",
  cologne: "koeln",
};

function getIngestToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-ingest-secret")?.trim() ?? null;
}

function mapSourceCategoryToEventCategory(
  sourceCategory: string | undefined,
): EventCategory {
  if (!sourceCategory) {
    return DEFAULT_INGEST_EVENT_CATEGORY;
  }

  const normalized = sourceCategory.trim().toLowerCase();
  return INGEST_EVENT_CATEGORY_MAP[normalized] ?? DEFAULT_INGEST_EVENT_CATEGORY;
}

const NAMED_HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  ndash: "-",
  mdash: "-",
  quot: '"',
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(\d+);/g, (_match, codePoint) => {
      const parsedCodePoint = Number.parseInt(codePoint, 10);
      return Number.isNaN(parsedCodePoint) ? _match : String.fromCodePoint(parsedCodePoint);
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, codePoint) => {
      const parsedCodePoint = Number.parseInt(codePoint, 16);
      return Number.isNaN(parsedCodePoint) ? _match : String.fromCodePoint(parsedCodePoint);
    })
    .replace(/&([a-z]+);/gi, (match, entity) => NAMED_HTML_ENTITY_MAP[entity.toLowerCase()] ?? match);
}

function sanitizeIngestText(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const sanitized = decodeHtmlEntities(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.length > 0 ? sanitized : undefined;
}

function normalizeCitySlugCandidate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = decodeHtmlEntities(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return SUPPORTED_CITY_ALIASES[normalized];
}

function extractCitySlugFromText(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = decodeHtmlEntities(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [alias, citySlug] of Object.entries(SUPPORTED_CITY_ALIASES)) {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^a-z])${escapedAlias}([^a-z]|$)`, "i").test(normalized)) {
      return citySlug;
    }
  }

  return undefined;
}

function extractCitySlugFromUrl(value: string | null) {
  if (!value) {
    return undefined;
  }

  try {
    const url = new URL(value);
    return extractCitySlugFromText(`${url.hostname} ${url.pathname}`);
  } catch {
    return undefined;
  }
}

const berlinDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getBerlinDateParts(date: Date) {
  const parts = berlinDateFormatter.formatToParts(date);
  const partByType = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number.parseInt(partByType.get("year") ?? "0", 10),
    month: Number.parseInt(partByType.get("month") ?? "0", 10),
    day: Number.parseInt(partByType.get("day") ?? "0", 10),
    hour: Number.parseInt(partByType.get("hour") ?? "0", 10),
    minute: Number.parseInt(partByType.get("minute") ?? "0", 10),
  };
}

function buildBerlinLocalDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  let candidate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = getBerlinDateParts(candidate);
    const desiredUtcMinutes = Date.UTC(year, month - 1, day, hour, minute) / 60000;
    const actualUtcMinutes =
      Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute) / 60000;
    const diffMinutes = actualUtcMinutes - desiredUtcMinutes;

    if (diffMinutes === 0) {
      return candidate;
    }

    candidate = new Date(candidate.getTime() - diffMinutes * 60000);
  }

  return candidate;
}

function parseStartsAtCandidate(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const directDate = new Date(trimmed);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  const normalized = decodeHtmlEntities(trimmed);
  const numericDateMatch = normalized.match(
    /(\d{1,2})[./](\d{1,2})[./](\d{4})(?:\D+(\d{1,2})[:.](\d{2}))?/,
  );

  if (!numericDateMatch) {
    return undefined;
  }

  const [, dayText, monthText, yearText, hourText, minuteText] = numericDateMatch;
  if (!hourText || !minuteText) {
    return undefined;
  }

  const day = Number.parseInt(dayText, 10);
  const month = Number.parseInt(monthText, 10);
  const year = Number.parseInt(yearText, 10);
  const hour = Number.parseInt(hourText, 10);
  const minute = Number.parseInt(minuteText, 10);

  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return undefined;
  }

  return buildBerlinLocalDate(year, month, day, hour, minute);
}

function resolveStartsAt(input: {
  startsAt?: string;
  rawDatetimeText?: string;
}) {
  return parseStartsAtCandidate(input.startsAt) ?? parseStartsAtCandidate(input.rawDatetimeText);
}

function resolveCitySlug(input: {
  citySlug?: string;
  cityGuess?: string;
  rawLocationText?: string;
  rawText?: string;
  sourceUrl: string | null;
}) {
  return (
    normalizeCitySlugCandidate(input.citySlug) ??
    normalizeCitySlugCandidate(input.cityGuess) ??
    extractCitySlugFromText(input.rawLocationText) ??
    extractCitySlugFromText(input.rawText) ??
    extractCitySlugFromUrl(input.sourceUrl)
  );
}

function resolveVenueName(input: {
  venueName?: string;
  rawLocationText?: string;
}) {
  return sanitizeIngestText(input.venueName) ?? sanitizeIngestText(input.rawLocationText);
}

export async function POST(request: NextRequest) {
  let step = "init";

  try {
    step = "config_check";
    if (!env.INGEST_SECRET) {
      return NextResponse.json(
        {
          error: "ingest_not_configured",
        },
        { status: 503 },
      );
    }

    step = "auth_check";
    const providedToken = getIngestToken(request);
    if (!providedToken || providedToken !== env.INGEST_SECRET) {
      return NextResponse.json(
        {
          error: "unauthorized",
        },
        { status: 401 },
      );
    }

    let body: unknown;

    try {
      step = "parse_json";
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "invalid_json",
        },
        { status: 400 },
      );
    }

    step = "validate_body";
    const parsed = ingestEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "validation_error",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    step = "sanitize_input";
    const title = sanitizeIngestText(parsed.data.title);
    const description = sanitizeIngestText(parsed.data.description);
    const rawText = sanitizeIngestText(parsed.data.rawText);
    const rawDatetimeText = sanitizeIngestText(parsed.data.rawDatetimeText);
    const rawLocationText = sanitizeIngestText(parsed.data.rawLocationText);
    const venueName = resolveVenueName({
      venueName: parsed.data.venueName,
      rawLocationText,
    });
    const sourceCategory = sanitizeIngestText(parsed.data.sourceCategory);
    const sourceUrl = getSafeHttpUrl(parsed.data.sourceUrl);
    const resolvedCitySlug = resolveCitySlug({
      citySlug: parsed.data.citySlug,
      cityGuess: parsed.data.cityGuess,
      rawLocationText,
      rawText,
      sourceUrl: sourceUrl ?? null,
    });

    if (!title || title.length < 2) {
      return NextResponse.json(
        {
          error: "validation_error",
          fieldErrors: {
            title: ["title_required"],
          },
        },
        { status: 400 },
      );
    }

    if (!sourceUrl) {
      return NextResponse.json(
        {
          error: "source_url_invalid",
        },
        { status: 400 },
      );
    }

    step = "map_category";
    const mappedCategory = mapSourceCategoryToEventCategory(sourceCategory);

    step = "load_city";
    if (!resolvedCitySlug) {
      return NextResponse.json(
        {
          error: "city_not_available",
        },
        { status: 400 },
      );
    }

    const city = await prisma.city.findFirst({
      where: {
        slug: resolvedCitySlug,
        countryCode: "DE",
      },
      select: {
        id: true,
        countryCode: true,
      },
    });

    if (!city) {
      return NextResponse.json(
        {
          error: "city_not_available",
        },
        { status: 400 },
      );
    }

    step = "parse_starts_at";
    const startsAt = resolveStartsAt({
      startsAt: parsed.data.startsAt,
      rawDatetimeText,
    });
    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      return NextResponse.json(
        {
          error: "date_invalid",
        },
        { status: 400 },
      );
    }

    step = "check_duplicate";
    const duplicateSearchWindow = getEventDuplicateSearchWindow(startsAt);
    const [existingEventCandidates, existingNormalizedEventCandidates] = await Promise.all([
      prisma.event.findMany({
        where: {
          cityId: city.id,
          startsAt: duplicateSearchWindow,
        },
        select: {
          id: true,
          title: true,
          venueName: true,
          startsAt: true,
        },
      }),
      prisma.normalizedIngestEvent.findMany({
        where: {
          cityId: city.id,
          startsAt: duplicateSearchWindow,
          normalizationStatus: {
            in: ACTIVE_NORMALIZED_INGEST_STATUSES,
          },
        },
        select: {
          id: true,
          title: true,
          venueName: true,
          startsAt: true,
        },
      }),
    ]);

    const existingEvent = findMatchingEventDuplicate(
      {
        title,
        venueName,
        startsAt,
      },
      existingEventCandidates,
    );
    const existingNormalizedEvent = findMatchingEventDuplicate(
      {
        title,
        venueName,
        startsAt,
      },
      existingNormalizedEventCandidates,
    );

    if (existingEvent || existingNormalizedEvent) {
      return NextResponse.json(
        {
          error: "duplicate_submission",
          eventId: existingEvent?.id ?? null,
          normalizedEventId: existingNormalizedEvent?.id ?? null,
        },
        { status: 409 },
      );
    }

    step = "transaction";
    const created = await prisma.$transaction(async (tx) => {
      const rawIngestItemId = crypto.randomUUID();
      const normalizedEventId = crypto.randomUUID();

      step = "transaction_raw_ingest_create";
      const rawIngestItem = await tx.rawIngestItem.create({
        data: {
          id: rawIngestItemId,
          entityGuess: "EVENT",
          platform: "API_INGEST",
          sourceUrl,
          rawTitle: parsed.data.title,
          rawText: parsed.data.rawText ?? parsed.data.description ?? null,
          rawDatetimeText: parsed.data.rawDatetimeText ?? parsed.data.startsAt ?? null,
          rawLocationText: parsed.data.rawLocationText ?? parsed.data.venueName ?? null,
          rawPayloadJson: JSON.stringify(body),
          cityGuess: parsed.data.cityGuess ?? resolvedCitySlug ?? null,
          countryCode: city.countryCode,
          status: "NORMALIZED",
          processedAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      step = "transaction_normalized_event_create";
      const normalizedEvent = await tx.normalizedIngestEvent.create({
        data: {
          id: normalizedEventId,
          rawIngestItemId: rawIngestItem.id,
          cityId: city.id,
          title,
          description,
          category: mappedCategory,
          venueName,
          startsAt,
          sourceUrl,
          sourceCategory,
        },
        select: {
          id: true,
          normalizationStatus: true,
        },
      });

      step = "transaction_submission_create";
      const submission = await tx.submission.create({
        data: {
          id: crypto.randomUUID(),
          submissionType: "INGEST",
          targetEntityType: "EVENT",
          targetEntityId: null,
          normalizedIngestEventId: normalizedEvent.id,
          payloadJson: JSON.stringify({
            kind: "event_ingest",
            rawIngestItemId: rawIngestItem.id,
            normalizedEventId: normalizedEvent.id,
            title,
            description,
            startsAt: startsAt.toISOString(),
            venueName,
            citySlug: resolvedCitySlug,
            sourceCategory,
            mappedCategory,
            sourceUrl,
          }),
          sourceUrl,
          status: "PENDING",
        },
        select: {
          id: true,
          status: true,
        },
      });

      return {
        rawIngestItem,
        normalizedEvent,
        submission,
      };
    });

    step = "response_success";
    return NextResponse.json(
      {
        ok: true,
        eventId: null,
        rawIngestItemId: created.rawIngestItem.id,
        normalizedEventId: created.normalizedEvent.id,
        submissionId: created.submission.id,
        normalizationStatus: created.normalizedEvent.normalizationStatus,
        productEventCreated: false,
      },
      { status: 201 },
    );
  } catch (error) {
    const prismaCode =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
        ? error.code
        : undefined;
    const errorName =
      error instanceof Error
        ? error.name
        : typeof error === "object" && error !== null && "name" in error
          ? String(error.name)
          : typeof error;

    console.error("ingest_event_failed", {
      step,
      errorName,
      prismaCode,
    });

    const handled = handleServerError(error, "ingest_event_failed");

    return NextResponse.json(
      {
        error: "internal_error",
        ...(isDevelopmentLike()
          ? {
              debugStep: step,
              debugHint: handled.code,
              debugMessage: handled.message,
            }
          : {}),
      },
      { status: 500 },
    );
  }
}
