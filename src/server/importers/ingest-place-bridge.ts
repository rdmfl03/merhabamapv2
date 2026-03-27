import {
  ImageSetStatus,
  MediaAssetRole,
  MediaAssetStatus,
  MediaRightsStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { readIngestArtifacts, type ReadIngestArtifactsResult } from "./read-ingest-artifacts";
import { resolvePlaceForIngest } from "./resolve-place-for-ingest";

type Logger = {
  info(message: string): void;
  warn(message: string): void;
};

type ImportedMediaAssetRow = ReadIngestArtifactsResult["mediaAssets"][number];
type ImportedPlaceRatingSourceRow =
  ReadIngestArtifactsResult["placeRatingSources"][number];

type ExistingPlaceSnapshot = {
  displayRatingCount: number | null;
  displayRatingValue: Prisma.Decimal | null;
  fallbackImageAssetId: string | null;
  id: string;
  imageSetStatus: ImageSetStatus;
  primaryImageAssetId: string | null;
  ratingSourceCount: number;
  ratingSummaryUpdatedAt: Date | null;
};

type PersistedMediaAssetRow = {
  assetUrl: string;
  id: string;
  rightsStatus: MediaRightsStatus;
  role: MediaAssetRole;
  sortOrder: number;
  status: MediaAssetStatus;
};

export type ImportIngestPlaceBridgeOptions = {
  artifacts: ReadIngestArtifactsResult;
  dryRun?: boolean;
  logger?: Logger;
  prismaClient?: PrismaClient;
};

export type ImportIngestPlaceBridgeSummary = {
  dryRun: boolean;
  matchedPlaceId: string | null;
  matchedPlaceSlug: string | null;
  matchStrategy: "place_source_url" | "place_website_url" | null;
  mediaCreated: number;
  mediaUnchanged: number;
  mediaUpdated: number;
  placeImageSummariesUpdated: number;
  placeRatingSummariesUpdated: number;
  placesResolved: number;
  placesSkippedUnresolved: number;
  ratingSourcesCreated: number;
  ratingSourcesSkipped: number;
  ratingSourcesUnchanged: number;
  ratingSourcesUpdated: number;
  warnings: string[];
};

type BridgeLogger = Logger & {
  warnings: string[];
};

function createLogger(logger?: Logger): BridgeLogger {
  const warnings: string[] = [];

  return {
    warnings,
    info(message: string) {
      logger?.info(message);
    },
    warn(message: string) {
      warnings.push(message);
      logger?.warn(message);
    },
  };
}

function normalizeDate(value: Date | null | undefined) {
  return value?.toISOString() ?? null;
}

function normalizeDecimal(
  value: Prisma.Decimal | number | null | undefined,
) {
  if (value == null) {
    return null;
  }

  return Number(value);
}

function pickRatingSummaryTimestamp(summary: ReadIngestArtifactsResult["placeRatingSummary"]) {
  return summary?.observedAt ?? summary?.calculatedAt ?? summary?.updatedAt ?? null;
}

function getImportedRatingKey(item: ImportedPlaceRatingSourceRow) {
  if (item.sourceUrl) {
    return `sourceUrl:${item.sourceUrl}`;
  }

  if (item.externalRef) {
    return `provider:${item.provider}:externalRef:${item.externalRef}`;
  }

  return null;
}

function assertUniqueImportedRows(args: {
  items: readonly ImportedMediaAssetRow[] | readonly ImportedPlaceRatingSourceRow[];
  keyForItem: (item: ImportedMediaAssetRow | ImportedPlaceRatingSourceRow) => string | null;
  label: string;
}) {
  const seen = new Set<string>();

  for (const item of args.items) {
    const key = args.keyForItem(item);
    if (!key) {
      continue;
    }

    if (seen.has(key)) {
      throw new Error(`Duplicate ${args.label} key in artifact payload: ${key}`);
    }

    seen.add(key);
  }
}

export function selectImportedPlaceImageSummary(
  mediaAssets: readonly PersistedMediaAssetRow[],
) {
  const primaryCandidate = [...mediaAssets]
    .filter(
      (asset) =>
        asset.role === MediaAssetRole.PRIMARY_CANDIDATE &&
        asset.status === MediaAssetStatus.ACTIVE &&
        asset.rightsStatus === MediaRightsStatus.DISPLAY_ALLOWED,
    )
    .sort((left, right) => left.sortOrder - right.sortOrder)[0] ?? null;

  const fallbackCandidate = [...mediaAssets]
    .filter(
      (asset) =>
        asset.role === MediaAssetRole.FALLBACK &&
        asset.status === MediaAssetStatus.ACTIVE &&
        (asset.rightsStatus === MediaRightsStatus.DISPLAY_ALLOWED ||
          asset.rightsStatus === MediaRightsStatus.INTERNAL_FALLBACK_ONLY),
    )
    .sort((left, right) => left.sortOrder - right.sortOrder)[0] ?? null;

  return {
    fallbackImageAssetId: fallbackCandidate?.id ?? null,
    imageSetStatus: primaryCandidate
      ? ImageSetStatus.REAL_IMAGE_AVAILABLE
      : fallbackCandidate
        ? ImageSetStatus.FALLBACK_ONLY
        : ImageSetStatus.MISSING,
    importedAssetIds: new Set(mediaAssets.map((asset) => asset.id)),
    primaryImageAssetId: primaryCandidate?.id ?? null,
  };
}

export function mediaAssetNeedsUpdate(
  existing: {
    altText: string | null;
    attributionText: string | null;
    attributionUrl: string | null;
    externalRef: string | null;
    observedAt: Date | null;
    rightsStatus: MediaRightsStatus;
    role: MediaAssetRole;
    sortOrder: number;
    sourceId: string | null;
    sourceProvider: string;
    sourceUrl: string | null;
    status: MediaAssetStatus;
  },
  next: {
    altText: string | null;
    attributionText: string | null;
    attributionUrl: string | null;
    externalRef: string | null;
    observedAt: Date | null;
    rightsStatus: MediaRightsStatus;
    role: MediaAssetRole;
    sortOrder: number;
    sourceId: string | null;
    sourceProvider: string;
    sourceUrl: string | null;
    status: MediaAssetStatus;
  },
) {
  return (
    existing.sourceProvider !== next.sourceProvider ||
    existing.sourceId !== next.sourceId ||
    existing.sourceUrl !== next.sourceUrl ||
    existing.externalRef !== next.externalRef ||
    existing.role !== next.role ||
    existing.status !== next.status ||
    existing.rightsStatus !== next.rightsStatus ||
    existing.attributionText !== next.attributionText ||
    existing.attributionUrl !== next.attributionUrl ||
    existing.altText !== next.altText ||
    existing.sortOrder !== next.sortOrder ||
    normalizeDate(existing.observedAt) !== normalizeDate(next.observedAt)
  );
}

export function placeRatingSourceNeedsUpdate(
  existing: {
    attributionText: string | null;
    attributionUrl: string | null;
    externalRef: string | null;
    isIncludedInDisplay: boolean;
    observedAt: Date | null;
    provider: string;
    ratingCount: number;
    ratingValue: Prisma.Decimal | number;
    reviewTextRightsStatus: string;
    scaleMax: Prisma.Decimal | number;
    sourceId: string | null;
    sourceUrl: string | null;
    status: string;
  },
  next: {
    attributionText: string | null;
    attributionUrl: string | null;
    externalRef: string | null;
    isIncludedInDisplay: boolean;
    observedAt: Date | null;
    provider: string;
    ratingCount: number;
    ratingValue: number;
    reviewTextRightsStatus: string;
    scaleMax: number;
    sourceId: string | null;
    sourceUrl: string | null;
    status: string;
  },
) {
  return (
    existing.provider !== next.provider ||
    existing.sourceId !== next.sourceId ||
    existing.sourceUrl !== next.sourceUrl ||
    existing.externalRef !== next.externalRef ||
    existing.status !== next.status ||
    normalizeDecimal(existing.ratingValue) !== next.ratingValue ||
    existing.ratingCount !== next.ratingCount ||
    normalizeDecimal(existing.scaleMax) !== next.scaleMax ||
    existing.isIncludedInDisplay !== next.isIncludedInDisplay ||
    normalizeDate(existing.observedAt) !== normalizeDate(next.observedAt) ||
    existing.attributionText !== next.attributionText ||
    existing.attributionUrl !== next.attributionUrl ||
    existing.reviewTextRightsStatus !== next.reviewTextRightsStatus
  );
}

function buildPlaceSummaryPatch(args: {
  currentPlace: ExistingPlaceSnapshot;
  importedMediaAssets: readonly PersistedMediaAssetRow[];
  placeRatingSummary: ReadIngestArtifactsResult["placeRatingSummary"];
}) {
  const patch: Prisma.PlaceUncheckedUpdateInput = {};
  let imageSummaryChanged = false;
  let ratingSummaryChanged = false;

  const imageSelection = selectImportedPlaceImageSummary(args.importedMediaAssets);
  const canUpdateImageSummary =
    (!args.currentPlace.primaryImageAssetId &&
      !args.currentPlace.fallbackImageAssetId) ||
    (args.currentPlace.primaryImageAssetId
      ? imageSelection.importedAssetIds.has(args.currentPlace.primaryImageAssetId)
      : false) ||
    (args.currentPlace.fallbackImageAssetId
      ? imageSelection.importedAssetIds.has(args.currentPlace.fallbackImageAssetId)
      : false) ||
    args.currentPlace.imageSetStatus === ImageSetStatus.MISSING;

  if (
    canUpdateImageSummary &&
    (args.currentPlace.primaryImageAssetId !== imageSelection.primaryImageAssetId ||
      args.currentPlace.fallbackImageAssetId !== imageSelection.fallbackImageAssetId ||
      args.currentPlace.imageSetStatus !== imageSelection.imageSetStatus)
  ) {
    patch.primaryImageAssetId = imageSelection.primaryImageAssetId;
    patch.fallbackImageAssetId = imageSelection.fallbackImageAssetId;
    patch.imageSetStatus = imageSelection.imageSetStatus;
    imageSummaryChanged = true;
  }

  if (args.placeRatingSummary) {
    const nextRatingValue = args.placeRatingSummary.averageRating;
    const nextRatingCount = args.placeRatingSummary.reviewCountTotal;
    const nextSourceCount = args.placeRatingSummary.sourceCount;
    const nextUpdatedAt = pickRatingSummaryTimestamp(args.placeRatingSummary);

    if (
      normalizeDecimal(args.currentPlace.displayRatingValue) !== nextRatingValue ||
      args.currentPlace.displayRatingCount !== nextRatingCount ||
      args.currentPlace.ratingSourceCount !== nextSourceCount ||
      normalizeDate(args.currentPlace.ratingSummaryUpdatedAt) !==
        normalizeDate(nextUpdatedAt)
    ) {
      patch.displayRatingValue = nextRatingValue;
      patch.displayRatingCount = nextRatingCount;
      patch.ratingSourceCount = nextSourceCount;
      patch.ratingSummaryUpdatedAt = nextUpdatedAt;
      ratingSummaryChanged = true;
    }
  }

  return {
    imageSummaryChanged,
    patch,
    ratingSummaryChanged,
  };
}

export async function importIngestPlaceBridge(
  options: ImportIngestPlaceBridgeOptions,
): Promise<ImportIngestPlaceBridgeSummary> {
  const prismaClient = options.prismaClient ?? prisma;
  const logger = createLogger(options.logger);
  const dryRun = options.dryRun ?? true;

  assertUniqueImportedRows({
    items: options.artifacts.mediaAssets,
    keyForItem: (item) =>
      "assetUrl" in item && typeof item.assetUrl === "string"
        ? `assetUrl:${item.assetUrl}`
        : null,
    label: "media asset",
  });
  assertUniqueImportedRows({
    items: options.artifacts.placeRatingSources,
    keyForItem: (item) =>
      "provider" in item ? getImportedRatingKey(item as ImportedPlaceRatingSourceRow) : null,
    label: "place rating source",
  });

  const resolvedPlace = await resolvePlaceForIngest({
    logger,
    placeArtifact: options.artifacts.placeArtifact,
    prismaClient,
  });

  if (!resolvedPlace) {
    return {
      dryRun,
      matchedPlaceId: null,
      matchedPlaceSlug: null,
      matchStrategy: null,
      mediaCreated: 0,
      mediaUnchanged: 0,
      mediaUpdated: 0,
      placeImageSummariesUpdated: 0,
      placeRatingSummariesUpdated: 0,
      placesResolved: 0,
      placesSkippedUnresolved: 1,
      ratingSourcesCreated: 0,
      ratingSourcesSkipped: 0,
      ratingSourcesUnchanged: 0,
      ratingSourcesUpdated: 0,
      warnings: logger.warnings,
    };
  }

  const summary = await prismaClient.$transaction(async (tx) => {
    const place = await tx.place.findUnique({
      where: { id: resolvedPlace.placeId },
      select: {
        id: true,
        displayRatingCount: true,
        displayRatingValue: true,
        fallbackImageAssetId: true,
        imageSetStatus: true,
        primaryImageAssetId: true,
        ratingSourceCount: true,
        ratingSummaryUpdatedAt: true,
      },
    });

    if (!place) {
      throw new Error(`Resolved place no longer exists: ${resolvedPlace.placeId}`);
    }

    const existingMediaAssets = await tx.mediaAsset.findMany({
      where: { placeId: place.id },
      select: {
        id: true,
        altText: true,
        assetUrl: true,
        attributionText: true,
        attributionUrl: true,
        externalRef: true,
        observedAt: true,
        rightsStatus: true,
        role: true,
        sortOrder: true,
        sourceId: true,
        sourceProvider: true,
        sourceUrl: true,
        status: true,
      },
    });
    const existingRatings = await tx.placeRatingSource.findMany({
      where: { placeId: place.id },
      select: {
        id: true,
        attributionText: true,
        attributionUrl: true,
        externalRef: true,
        isIncludedInDisplay: true,
        observedAt: true,
        provider: true,
        ratingCount: true,
        ratingValue: true,
        reviewTextRightsStatus: true,
        scaleMax: true,
        sourceId: true,
        sourceUrl: true,
        status: true,
      },
    });

    const sourceIdsByUrl = new Map<string, string>();
    const resolveSourceIdByUrl = async (sourceUrl: string | null | undefined) => {
      if (!sourceUrl) {
        return null;
      }

      if (sourceIdsByUrl.has(sourceUrl)) {
        return sourceIdsByUrl.get(sourceUrl) ?? null;
      }

      const source = await tx.source.findUnique({
        where: { url: sourceUrl },
        select: { id: true },
      });

      sourceIdsByUrl.set(sourceUrl, source?.id ?? "");
      return source?.id ?? null;
    };

    let mediaCreated = 0;
    let mediaUpdated = 0;
    let mediaUnchanged = 0;
    const importedMediaAssets: PersistedMediaAssetRow[] = [];

    for (const item of options.artifacts.mediaAssets) {
      const existing = existingMediaAssets.find(
        (candidate) => candidate.assetUrl === item.assetUrl,
      );
      const sourceId = await resolveSourceIdByUrl(item.sourceUrl);
      const mediaData = {
        altText: item.altText ?? null,
        assetUrl: item.assetUrl,
        attributionText: item.attributionText ?? null,
        attributionUrl: item.attributionUrl ?? null,
        externalRef: item.externalRef ?? null,
        observedAt: item.observedAt ?? null,
        placeId: place.id,
        rightsStatus: item.rightsStatus,
        role: item.role,
        sortOrder: item.sortOrder,
        sourceId,
        sourceProvider: item.sourceProvider,
        sourceUrl: item.sourceUrl ?? null,
        status: item.status,
      };

      if (!existing) {
        mediaCreated += 1;
        if (dryRun) {
          importedMediaAssets.push({
            id: `dry-run:${item.assetUrl}`,
            assetUrl: item.assetUrl,
            rightsStatus: item.rightsStatus,
            role: item.role,
            sortOrder: item.sortOrder,
            status: item.status,
          });
          continue;
        }

        const created = await tx.mediaAsset.create({
          data: mediaData,
          select: {
            id: true,
            assetUrl: true,
            rightsStatus: true,
            role: true,
            sortOrder: true,
            status: true,
          },
        });
        importedMediaAssets.push(created);
        continue;
      }

      if (mediaAssetNeedsUpdate(existing, mediaData)) {
        mediaUpdated += 1;
        if (dryRun) {
          importedMediaAssets.push({
            id: existing.id,
            assetUrl: item.assetUrl,
            rightsStatus: item.rightsStatus,
            role: item.role,
            sortOrder: item.sortOrder,
            status: item.status,
          });
          continue;
        }

        const updated = await tx.mediaAsset.update({
          where: { id: existing.id },
          data: mediaData,
          select: {
            id: true,
            assetUrl: true,
            rightsStatus: true,
            role: true,
            sortOrder: true,
            status: true,
          },
        });
        importedMediaAssets.push(updated);
        continue;
      }

      mediaUnchanged += 1;
      importedMediaAssets.push({
        id: existing.id,
        assetUrl: existing.assetUrl,
        rightsStatus: existing.rightsStatus,
        role: existing.role,
        sortOrder: existing.sortOrder,
        status: existing.status,
      });
    }

    let ratingSourcesCreated = 0;
    let ratingSourcesUpdated = 0;
    let ratingSourcesUnchanged = 0;
    let ratingSourcesSkipped = 0;

    for (const item of options.artifacts.placeRatingSources) {
      const key = getImportedRatingKey(item);
      if (!key) {
        ratingSourcesSkipped += 1;
        logger.warn(
          `Skipping rating source for provider ${item.provider} because neither sourceUrl nor externalRef is available.`,
        );
        continue;
      }

      const existing = existingRatings.find((candidate) => {
        if (item.sourceUrl) {
          return candidate.sourceUrl === item.sourceUrl;
        }

        return (
          candidate.sourceUrl == null &&
          candidate.provider === item.provider &&
          candidate.externalRef === item.externalRef
        );
      });
      const sourceId = await resolveSourceIdByUrl(item.sourceUrl);
      const ratingData = {
        attributionText: item.attributionText ?? null,
        attributionUrl: item.attributionUrl ?? null,
        externalRef: item.externalRef ?? null,
        isIncludedInDisplay: item.isIncludedInDisplay,
        observedAt: item.observedAt ?? null,
        placeId: place.id,
        provider: item.provider,
        ratingCount: item.ratingCount,
        ratingValue: item.ratingValue,
        reviewTextRightsStatus: item.reviewTextRightsStatus,
        scaleMax: item.scaleMax,
        sourceId,
        sourceUrl: item.sourceUrl ?? null,
        status: item.status,
      };

      if (!existing) {
        ratingSourcesCreated += 1;
        if (!dryRun) {
          await tx.placeRatingSource.create({
            data: ratingData,
            select: { id: true },
          });
        }
        continue;
      }

      if (placeRatingSourceNeedsUpdate(existing, ratingData)) {
        ratingSourcesUpdated += 1;
        if (!dryRun) {
          await tx.placeRatingSource.update({
            where: { id: existing.id },
            data: ratingData,
            select: { id: true },
          });
        }
        continue;
      }

      ratingSourcesUnchanged += 1;
    }

    const placeSummaryPatch = buildPlaceSummaryPatch({
      currentPlace: place,
      importedMediaAssets,
      placeRatingSummary: options.artifacts.placeRatingSummary,
    });

    if (
      !dryRun &&
      Object.keys(placeSummaryPatch.patch).length > 0
    ) {
      await tx.place.update({
        where: { id: place.id },
        data: placeSummaryPatch.patch,
        select: { id: true },
      });
    }

    return {
      mediaCreated,
      mediaUnchanged,
      mediaUpdated,
      placeImageSummariesUpdated: placeSummaryPatch.imageSummaryChanged ? 1 : 0,
      placeRatingSummariesUpdated: placeSummaryPatch.ratingSummaryChanged ? 1 : 0,
      ratingSourcesCreated,
      ratingSourcesSkipped,
      ratingSourcesUnchanged,
      ratingSourcesUpdated,
    };
  });

  return {
    dryRun,
    matchedPlaceId: resolvedPlace.placeId,
    matchedPlaceSlug: resolvedPlace.placeSlug,
    matchStrategy: resolvedPlace.matchStrategy,
    mediaCreated: summary.mediaCreated,
    mediaUnchanged: summary.mediaUnchanged,
    mediaUpdated: summary.mediaUpdated,
    placeImageSummariesUpdated: summary.placeImageSummariesUpdated,
    placeRatingSummariesUpdated: summary.placeRatingSummariesUpdated,
    placesResolved: 1,
    placesSkippedUnresolved: 0,
    ratingSourcesCreated: summary.ratingSourcesCreated,
    ratingSourcesSkipped: summary.ratingSourcesSkipped,
    ratingSourcesUnchanged: summary.ratingSourcesUnchanged,
    ratingSourcesUpdated: summary.ratingSourcesUpdated,
    warnings: logger.warnings,
  };
}

export async function runImportIngestPlaceBridgeFromPaths(args: {
  dryRun?: boolean;
  logger?: Logger;
  mediaAssetsSidecarPath: string;
  placeArtifactPath: string;
  placeRatingSourcesSidecarPath: string;
  placeRatingSummarySidecarPath?: string;
  prismaClient?: PrismaClient;
}) {
  const artifacts = await readIngestArtifacts({
    mediaAssetsSidecarPath: args.mediaAssetsSidecarPath,
    placeArtifactPath: args.placeArtifactPath,
    placeRatingSourcesSidecarPath: args.placeRatingSourcesSidecarPath,
    placeRatingSummarySidecarPath: args.placeRatingSummarySidecarPath,
  });

  return importIngestPlaceBridge({
    artifacts,
    dryRun: args.dryRun,
    logger: args.logger,
    prismaClient: args.prismaClient,
  });
}
