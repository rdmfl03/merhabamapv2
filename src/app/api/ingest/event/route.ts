import { NextRequest, NextResponse } from "next/server";
import type { EventCategory } from "@prisma/client";

import { env } from "@/lib/env";
import { handleServerError } from "@/lib/errors/handle-server-error";
import { prisma } from "@/lib/prisma";
import { buildSlugBase, buildUniqueSlug, getSafeHttpUrl } from "@/lib/submissions";
import { ingestEventSchema } from "@/lib/validators/submissions";

export const dynamic = "force-dynamic";

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

export async function POST(request: NextRequest) {
  try {
    if (!env.INGEST_SECRET) {
      return NextResponse.json(
        {
          error: "ingest_not_configured",
        },
        { status: 503 },
      );
    }

    const providedToken = getIngestToken(request);
    if (!providedToken || providedToken !== env.INGEST_SECRET) {
      return NextResponse.json(
        {
          error: "unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
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

    const sourceUrl = getSafeHttpUrl(parsed.data.sourceUrl);
    if (!sourceUrl) {
      return NextResponse.json(
        {
          error: "source_url_invalid",
        },
        { status: 400 },
      );
    }

    const mappedCategory = mapSourceCategoryToEventCategory(parsed.data.sourceCategory);

    const city = await prisma.city.findFirst({
      where: {
        slug: "berlin",
        countryCode: "DE",
      },
      select: {
        id: true,
        slug: true,
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

    const startsAt = new Date(parsed.data.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json(
        {
          error: "date_invalid",
        },
        { status: 400 },
      );
    }

    const existingEvent = await prisma.event.findFirst({
      where: {
        title: parsed.data.title,
        cityId: city.id,
        startsAt,
      },
      select: {
        id: true,
      },
    });

    if (existingEvent) {
      return NextResponse.json(
        {
          error: "duplicate_submission",
          eventId: existingEvent.id,
        },
        { status: 409 },
      );
    }

    const slugBase = buildSlugBase(`${parsed.data.title}-${city.slug}`);
    const slug = await buildUniqueSlug(slugBase, async (candidate) => {
      const count = await prisma.event.count({
        where: {
          slug: candidate,
        },
      });

      return count > 0;
    });

    const created = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          slug,
          title: parsed.data.title,
          descriptionDe: parsed.data.description,
          descriptionTr: parsed.data.description,
          category: mappedCategory,
          cityId: city.id,
          venueName: parsed.data.venueName,
          startsAt,
          externalUrl: sourceUrl,
          moderationStatus: "PENDING",
          isPublished: false,
        },
        select: {
          id: true,
          slug: true,
          moderationStatus: true,
          isPublished: true,
        },
      });

      const submission = await tx.submission.create({
        data: {
          id: crypto.randomUUID(),
          submissionType: "INGEST",
          targetEntityType: "EVENT",
          targetEntityId: event.id,
          payloadJson: JSON.stringify({
            kind: "event_ingest",
            title: parsed.data.title,
            description: parsed.data.description,
            startsAt: parsed.data.startsAt,
            venueName: parsed.data.venueName,
            citySlug: parsed.data.citySlug,
            sourceCategory: parsed.data.sourceCategory,
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
        event,
        submission,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        eventId: created.event.id,
        submissionId: created.submission.id,
        moderationStatus: created.event.moderationStatus,
        isPublished: created.event.isPublished,
      },
      { status: 201 },
    );
  } catch (error) {
    handleServerError(error, "ingest_event_failed");

    return NextResponse.json(
      {
        error: "internal_error",
      },
      { status: 500 },
    );
  }
}
