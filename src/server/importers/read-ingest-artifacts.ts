import { readFile } from "node:fs/promises";

import {
  MediaAssetRole,
  MediaAssetStatus,
  MediaRightsStatus,
  MediaSourceProvider,
  PlaceRatingSourceStatus,
  RatingSourceProvider,
  ReviewTextRightsStatus,
} from "@prisma/client";
import { z } from "zod";

const supportedSchemaVersionSchema = z
  .union([z.literal("v1"), z.literal("1"), z.literal("1.0"), z.literal(1)])
  .transform(() => "v1" as const);

const optionalStringSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrlSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const optionalDateSchema = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.date().optional(),
);

const artifactBaseSchema = z
  .object({
    artifactType: z.string().min(1),
    schemaVersion: supportedSchemaVersionSchema.optional(),
    version: supportedSchemaVersionSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.schemaVersion && !value.version) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Artifact must declare schemaVersion or version.",
        path: ["schemaVersion"],
      });
    }
  })
  .transform((value) => ({
    artifactType: value.artifactType,
    schemaVersion: value.schemaVersion ?? value.version ?? "v1",
  }));

const ratingSummaryPayloadSchema = z.object({
  averageRating: z.number().min(0).max(5),
  reviewCountTotal: z.number().int().min(0),
  sourceCount: z.number().int().min(0),
  observedAt: optionalDateSchema,
  calculatedAt: optionalDateSchema,
  updatedAt: optionalDateSchema,
});

const placeImportReadyPlaceSchema = z
  .object({
    slug: optionalStringSchema,
    name: optionalStringSchema,
    sourceProvider: z.nativeEnum(MediaSourceProvider).optional(),
    sourceUrl: optionalUrlSchema,
    websiteUrl: optionalUrlSchema,
    placeUrl: optionalUrlSchema,
    externalRef: optionalStringSchema,
    ratingSummary: ratingSummaryPayloadSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.sourceUrl && !value.websiteUrl && !value.placeUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Place artifact must include sourceUrl, websiteUrl, or placeUrl.",
        path: ["sourceUrl"],
      });
    }
  });

const placeImportReadyEnvelopeSchema = z
  .object({
    artifactType: z.enum(["place-import-ready", "place_import_ready"]),
    schemaVersion: supportedSchemaVersionSchema.optional(),
    version: supportedSchemaVersionSchema.optional(),
    place: placeImportReadyPlaceSchema,
    ratingSummary: ratingSummaryPayloadSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.schemaVersion && !value.version) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Artifact must declare schemaVersion or version.",
        path: ["schemaVersion"],
      });
    }
  })
  .transform((value) => ({
    artifactType: value.artifactType,
    schemaVersion: value.schemaVersion ?? value.version ?? "v1",
    place: value.place,
    ratingSummary: value.ratingSummary ?? value.place.ratingSummary ?? null,
  }));

const mediaAssetItemSchema = z.object({
  entityType: z.enum(["PLACE"]).optional(),
  assetUrl: z.string().url(),
  sourceProvider: z.nativeEnum(MediaSourceProvider),
  sourceId: optionalStringSchema,
  sourceUrl: optionalUrlSchema,
  externalRef: optionalStringSchema,
  role: z.nativeEnum(MediaAssetRole),
  status: z.nativeEnum(MediaAssetStatus),
  rightsStatus: z.nativeEnum(MediaRightsStatus),
  attributionText: optionalStringSchema,
  attributionUrl: optionalUrlSchema,
  altText: optionalStringSchema,
  sortOrder: z.number().int().min(0).default(0),
  observedAt: optionalDateSchema,
});

const mediaAssetsSidecarEnvelopeSchema = z
  .object({
    artifactType: z.enum(["media-assets-sidecar", "media_assets_sidecar"]),
    schemaVersion: supportedSchemaVersionSchema.optional(),
    version: supportedSchemaVersionSchema.optional(),
    items: z.array(mediaAssetItemSchema).optional(),
    mediaAssets: z.array(mediaAssetItemSchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.schemaVersion && !value.version) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Artifact must declare schemaVersion or version.",
        path: ["schemaVersion"],
      });
    }

    if (!value.items && !value.mediaAssets) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Media asset sidecar must include items or mediaAssets.",
        path: ["items"],
      });
    }
  })
  .transform((value) => ({
    artifactType: value.artifactType,
    schemaVersion: value.schemaVersion ?? value.version ?? "v1",
    items: value.items ?? value.mediaAssets ?? [],
  }));

const placeRatingSourceItemSchema = z.object({
  entityType: z.enum(["PLACE"]).optional(),
  provider: z.nativeEnum(RatingSourceProvider),
  sourceId: optionalStringSchema,
  sourceUrl: optionalUrlSchema,
  externalRef: optionalStringSchema,
  status: z.nativeEnum(PlaceRatingSourceStatus),
  ratingValue: z.number().min(0).max(5),
  ratingCount: z.number().int().min(0),
  scaleMax: z.number().positive(),
  isIncludedInDisplay: z.boolean().default(true),
  observedAt: optionalDateSchema,
  attributionText: optionalStringSchema,
  attributionUrl: optionalUrlSchema,
  reviewTextRightsStatus: z.nativeEnum(ReviewTextRightsStatus).default("NOT_STORED"),
});

const placeRatingSourcesSidecarEnvelopeSchema = z
  .object({
    artifactType: z.enum([
      "place-rating-sources-sidecar",
      "place_rating_sources_sidecar",
    ]),
    schemaVersion: supportedSchemaVersionSchema.optional(),
    version: supportedSchemaVersionSchema.optional(),
    items: z.array(placeRatingSourceItemSchema).optional(),
    ratingSources: z.array(placeRatingSourceItemSchema).optional(),
    placeRatingSources: z.array(placeRatingSourceItemSchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.schemaVersion && !value.version) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Artifact must declare schemaVersion or version.",
        path: ["schemaVersion"],
      });
    }

    if (!value.items && !value.ratingSources && !value.placeRatingSources) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rating source sidecar must include items, ratingSources, or placeRatingSources.",
        path: ["items"],
      });
    }
  })
  .transform((value) => ({
    artifactType: value.artifactType,
    schemaVersion: value.schemaVersion ?? value.version ?? "v1",
    items: value.items ?? value.ratingSources ?? value.placeRatingSources ?? [],
  }));

const placeRatingSummarySidecarEnvelopeSchema = z
  .object({
    artifactType: z.enum([
      "place-rating-summary-sidecar",
      "place_rating_summary_sidecar",
    ]),
    schemaVersion: supportedSchemaVersionSchema.optional(),
    version: supportedSchemaVersionSchema.optional(),
    summary: ratingSummaryPayloadSchema.optional(),
    ratingSummary: ratingSummaryPayloadSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.schemaVersion && !value.version) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Artifact must declare schemaVersion or version.",
        path: ["schemaVersion"],
      });
    }

    if (!value.summary && !value.ratingSummary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rating summary sidecar must include summary or ratingSummary.",
        path: ["summary"],
      });
    }
  })
  .transform((value) => ({
    artifactType: value.artifactType,
    schemaVersion: value.schemaVersion ?? value.version ?? "v1",
    summary: value.summary ?? value.ratingSummary!,
  }));

export type IngestPlaceImportReadyArtifact = z.infer<
  typeof placeImportReadyEnvelopeSchema
>;
export type IngestMediaAssetSidecarItem = z.infer<typeof mediaAssetItemSchema>;
export type IngestPlaceRatingSourceSidecarItem = z.infer<
  typeof placeRatingSourceItemSchema
>;
export type IngestPlaceRatingSummaryPayload = z.infer<
  typeof ratingSummaryPayloadSchema
>;

export type ReadIngestArtifactsPaths = {
  mediaAssetsSidecarPath: string;
  placeArtifactPath: string;
  placeRatingSourcesSidecarPath: string;
  placeRatingSummarySidecarPath?: string;
};

export type ReadIngestArtifactsResult = {
  mediaAssets: IngestMediaAssetSidecarItem[];
  placeArtifact: IngestPlaceImportReadyArtifact;
  placeRatingSources: IngestPlaceRatingSourceSidecarItem[];
  placeRatingSummary: IngestPlaceRatingSummaryPayload | null;
};

async function readJsonArtifact(path: string) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as unknown;
}

function formatZodIssues(error: z.ZodError) {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "artifact"}: ${issue.message}`)
    .join("; ");
}

function parseArtifact<T>(
  label: string,
  payload: unknown,
  schema: z.ZodTypeAny,
) {
  try {
    artifactBaseSchema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`${label} is invalid: ${formatZodIssues(error)}`);
    }

    throw error;
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`${label} is invalid: ${formatZodIssues(parsed.error)}`);
  }

  return parsed.data as T;
}

export async function readIngestArtifacts(
  paths: ReadIngestArtifactsPaths,
): Promise<ReadIngestArtifactsResult> {
  const [
    placeArtifactPayload,
    mediaAssetsPayload,
    placeRatingSourcesPayload,
    placeRatingSummaryPayload,
  ] = await Promise.all([
    readJsonArtifact(paths.placeArtifactPath),
    readJsonArtifact(paths.mediaAssetsSidecarPath),
    readJsonArtifact(paths.placeRatingSourcesSidecarPath),
    paths.placeRatingSummarySidecarPath
      ? readJsonArtifact(paths.placeRatingSummarySidecarPath)
      : Promise.resolve(null),
  ]);

  const placeArtifact: IngestPlaceImportReadyArtifact = parseArtifact(
    "place artifact",
    placeArtifactPayload,
    placeImportReadyEnvelopeSchema,
  );
  const mediaAssetsSidecar: {
    artifactType: "media-assets-sidecar" | "media_assets_sidecar";
    items: IngestMediaAssetSidecarItem[];
    schemaVersion: "v1";
  } = parseArtifact(
    "media assets sidecar",
    mediaAssetsPayload,
    mediaAssetsSidecarEnvelopeSchema,
  );
  const placeRatingSourcesSidecar: {
    artifactType:
      | "place-rating-sources-sidecar"
      | "place_rating_sources_sidecar";
    items: IngestPlaceRatingSourceSidecarItem[];
    schemaVersion: "v1";
  } = parseArtifact(
    "place rating sources sidecar",
    placeRatingSourcesPayload,
    placeRatingSourcesSidecarEnvelopeSchema,
  );
  const placeRatingSummarySidecar: {
    artifactType:
      | "place-rating-summary-sidecar"
      | "place_rating_summary_sidecar";
    schemaVersion: "v1";
    summary: IngestPlaceRatingSummaryPayload;
  } | null = placeRatingSummaryPayload
    ? parseArtifact(
        "place rating summary sidecar",
        placeRatingSummaryPayload,
        placeRatingSummarySidecarEnvelopeSchema,
      )
    : null;

  return {
    placeArtifact,
    mediaAssets: mediaAssetsSidecar.items,
    placeRatingSources: placeRatingSourcesSidecar.items,
    placeRatingSummary:
      placeRatingSummarySidecar?.summary ?? placeArtifact.ratingSummary ?? null,
  };
}
