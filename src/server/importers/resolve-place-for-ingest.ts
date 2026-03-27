import type { PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { IngestPlaceImportReadyArtifact } from "./read-ingest-artifacts";

export type ResolvePlaceForIngestLogger = {
  warn(message: string): void;
};

export type ResolvedPlaceForIngest = {
  matchUrl: string;
  matchStrategy: "place_source_url" | "place_website_url";
  placeId: string;
  placeName: string;
  placeSlug: string;
};

function normalizeUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function dedupeStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export async function resolvePlaceForIngest(args: {
  logger?: ResolvePlaceForIngestLogger;
  placeArtifact: IngestPlaceImportReadyArtifact;
  prismaClient?: PrismaClient;
}): Promise<ResolvedPlaceForIngest | null> {
  const prismaClient = args.prismaClient ?? prisma;
  const logger = args.logger;

  const sourceUrl = normalizeUrl(args.placeArtifact.place.sourceUrl);
  if (sourceUrl) {
    const placeSourceMatches = await prismaClient.placeSource.findMany({
      where: {
        sourceUrl,
      },
      select: {
        place: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const uniqueMatches = [
      ...new Map(
        placeSourceMatches.map((match) => [match.place.id, match.place]),
      ).values(),
    ];

    if (uniqueMatches.length === 1) {
      return {
        placeId: uniqueMatches[0].id,
        placeSlug: uniqueMatches[0].slug,
        placeName: uniqueMatches[0].name,
        matchUrl: sourceUrl,
        matchStrategy: "place_source_url",
      };
    }

    if (uniqueMatches.length > 1) {
      logger?.warn(
        `Skipping import because source URL matched multiple places: ${sourceUrl}`,
      );
      return null;
    }
  }

  const explicitWebsiteCandidates = dedupeStrings([
    normalizeUrl(args.placeArtifact.place.websiteUrl),
    normalizeUrl(args.placeArtifact.place.placeUrl),
  ]);

  for (const websiteUrl of explicitWebsiteCandidates) {
    const websiteMatches = await prismaClient.place.findMany({
      where: {
        websiteUrl,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (websiteMatches.length === 1) {
      return {
        placeId: websiteMatches[0].id,
        placeSlug: websiteMatches[0].slug,
        placeName: websiteMatches[0].name,
        matchUrl: websiteUrl,
        matchStrategy: "place_website_url",
      };
    }

    if (websiteMatches.length > 1) {
      logger?.warn(
        `Skipping import because website URL matched multiple places: ${websiteUrl}`,
      );
      return null;
    }
  }

  logger?.warn(
    "Skipping import because no exact place mapping was found via sourceUrl or explicit website/place URL.",
  );
  return null;
}
