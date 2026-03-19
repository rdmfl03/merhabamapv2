import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { handleServerError } from "@/lib/errors/handle-server-error";
import { prisma } from "@/lib/prisma";
import { buildSlugBase, buildUniqueSlug, getSafeHttpUrl } from "@/lib/submissions";
import { ingestPlaceSchema } from "@/lib/validators/submissions";

export const dynamic = "force-dynamic";

const DEFAULT_INGEST_PLACE_CATEGORY_SLUG = "services";
const INGEST_PLACE_CATEGORY_MAP: Record<string, string> = {
  restaurant: "restaurants",
  restaurants: "restaurants",
  restauranten: "restaurants",
  cafe: "cafes",
  cafes: "cafes",
  coffee: "cafes",
  bakery: "bakeries",
  bakeries: "bakeries",
  firin: "bakeries",
  patisserie: "bakeries",
  market: "markets",
  markets: "markets",
  supermarket: "markets",
  grocery: "markets",
  mosque: "mosques",
  mosques: "mosques",
  prayer: "mosques",
  barber: "barbers",
  barbers: "barbers",
  hairdresser: "barbers",
  travel: "travel-agencies",
  "travel-agency": "travel-agencies",
  "travel-agencies": "travel-agencies",
  service: "services",
  services: "services",
};

function getIngestToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-ingest-secret")?.trim() ?? null;
}

function mapSourceCategoryToPlaceCategorySlug(input: {
  categorySlug?: string;
  sourceCategory?: string;
}) {
  const candidates = [input.categorySlug, input.sourceCategory];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = candidate.trim().toLowerCase();
    const mapped = INGEST_PLACE_CATEGORY_MAP[normalized];

    if (mapped) {
      return mapped;
    }
  }

  return DEFAULT_INGEST_PLACE_CATEGORY_SLUG;
}

export async function POST(request: NextRequest) {
  try {
    if (!env.INGEST_SECRET) {
      return NextResponse.json({ error: "ingest_not_configured" }, { status: 503 });
    }

    const providedToken = getIngestToken(request);
    if (!providedToken || providedToken !== env.INGEST_SECRET) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ingestPlaceSchema.safeParse(body);

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
      return NextResponse.json({ error: "source_url_invalid" }, { status: 400 });
    }

    const websiteUrl = getSafeHttpUrl(parsed.data.websiteUrl);
    if (parsed.data.websiteUrl && !websiteUrl) {
      return NextResponse.json({ error: "website_url_invalid" }, { status: 400 });
    }

    const city = await prisma.city.findFirst({
      where: {
        slug: parsed.data.citySlug,
        countryCode: "DE",
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!city) {
      return NextResponse.json({ error: "city_not_available" }, { status: 400 });
    }

    const mappedCategorySlug = mapSourceCategoryToPlaceCategorySlug({
      categorySlug: parsed.data.categorySlug,
      sourceCategory: parsed.data.sourceCategory,
    });

    const category = await prisma.placeCategory.findUnique({
      where: {
        slug: mappedCategorySlug,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!category) {
      return NextResponse.json({ error: "category_not_available" }, { status: 400 });
    }

    const existingPlace = await prisma.place.findFirst({
      where: {
        cityId: city.id,
        OR: [
          {
            name: {
              equals: parsed.data.name,
              mode: "insensitive",
            },
          },
          ...(websiteUrl
            ? [
                {
                  websiteUrl,
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
      },
    });

    if (existingPlace) {
      return NextResponse.json(
        {
          error: "duplicate_submission",
          placeId: existingPlace.id,
        },
        { status: 409 },
      );
    }

    const slugBase = buildSlugBase(`${parsed.data.name}-${city.slug}`);
    const slug = await buildUniqueSlug(slugBase, async (candidate) => {
      const count = await prisma.place.count({
        where: {
          slug: candidate,
        },
      });

      return count > 0;
    });

    const created = await prisma.$transaction(async (tx) => {
      const place = await tx.place.create({
        data: {
          slug,
          name: parsed.data.name,
          descriptionDe: parsed.data.description,
          descriptionTr: parsed.data.description,
          categoryId: category.id,
          cityId: city.id,
          addressLine1: parsed.data.addressLine1,
          postalCode: parsed.data.postalCode,
          latitude: parsed.data.latitude,
          longitude: parsed.data.longitude,
          phone: parsed.data.phone,
          websiteUrl,
          moderationStatus: "PENDING",
          isPublished: false,
        },
        select: {
          id: true,
          moderationStatus: true,
          isPublished: true,
        },
      });

      const submission = await tx.submission.create({
        data: {
          id: crypto.randomUUID(),
          submissionType: "INGEST",
          targetEntityType: "PLACE",
          targetEntityId: place.id,
          payloadJson: JSON.stringify({
            kind: "place_ingest",
            name: parsed.data.name,
            description: parsed.data.description,
            citySlug: parsed.data.citySlug,
            categorySlug: parsed.data.categorySlug,
            sourceCategory: parsed.data.sourceCategory,
            mappedCategorySlug: category.slug,
            websiteUrl,
            addressLine1: parsed.data.addressLine1,
            postalCode: parsed.data.postalCode,
            district: parsed.data.district,
            phone: parsed.data.phone,
            latitude: parsed.data.latitude,
            longitude: parsed.data.longitude,
            sourceUrl,
          }),
          sourceUrl,
          status: "PENDING",
        },
        select: {
          id: true,
        },
      });

      return { place, submission };
    });

    return NextResponse.json(
      {
        ok: true,
        placeId: created.place.id,
        submissionId: created.submission.id,
        moderationStatus: created.place.moderationStatus,
        isPublished: created.place.isPublished,
      },
      { status: 201 },
    );
  } catch (error) {
    handleServerError(error, "ingest_place_failed");

    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
