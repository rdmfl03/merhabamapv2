import { access } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { runImportIngestPlaceBridgeFromPaths } from "@/server/importers/ingest-place-bridge";

type CliOptions = {
  apply: boolean;
  inputDir?: string;
  mediaAssetsSidecarPath?: string;
  placeArtifactPath?: string;
  placeRatingSourcesSidecarPath?: string;
  placeRatingSummarySidecarPath?: string;
};

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    apply: false,
  };

  for (const arg of argv) {
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.apply = false;
      continue;
    }

    if (arg.startsWith("--input-dir=")) {
      options.inputDir = arg.slice("--input-dir=".length);
      continue;
    }

    if (arg.startsWith("--place-artifact=")) {
      options.placeArtifactPath = arg.slice("--place-artifact=".length);
      continue;
    }

    if (arg.startsWith("--media-sidecar=")) {
      options.mediaAssetsSidecarPath = arg.slice("--media-sidecar=".length);
      continue;
    }

    if (arg.startsWith("--rating-sources-sidecar=")) {
      options.placeRatingSourcesSidecarPath = arg.slice(
        "--rating-sources-sidecar=".length,
      );
      continue;
    }

    if (arg.startsWith("--rating-summary-sidecar=")) {
      options.placeRatingSummarySidecarPath = arg.slice(
        "--rating-summary-sidecar=".length,
      );
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

async function resolveFileFromDirectory(
  inputDir: string,
  candidates: readonly string[],
  required: boolean,
) {
  for (const candidate of candidates) {
    const resolvedPath = path.join(inputDir, candidate);
    if (await fileExists(resolvedPath)) {
      return resolvedPath;
    }
  }

  if (!required) {
    return undefined;
  }

  throw new Error(
    `Missing required artifact in ${inputDir}: expected one of ${candidates.join(", ")}`,
  );
}

async function resolveArtifactPaths(options: CliOptions) {
  const resolved = {
    mediaAssetsSidecarPath: options.mediaAssetsSidecarPath,
    placeArtifactPath: options.placeArtifactPath,
    placeRatingSourcesSidecarPath: options.placeRatingSourcesSidecarPath,
    placeRatingSummarySidecarPath: options.placeRatingSummarySidecarPath,
  };

  if (options.inputDir) {
    resolved.placeArtifactPath ??= await resolveFileFromDirectory(
      options.inputDir,
      ["place-import-ready.json", "place_import_ready.json"],
      true,
    );
    resolved.mediaAssetsSidecarPath ??= await resolveFileFromDirectory(
      options.inputDir,
      ["media-assets.sidecar.json", "media_assets.sidecar.json"],
      true,
    );
    resolved.placeRatingSourcesSidecarPath ??= await resolveFileFromDirectory(
      options.inputDir,
      [
        "place-rating-sources.sidecar.json",
        "place_rating_sources.sidecar.json",
      ],
      true,
    );
    resolved.placeRatingSummarySidecarPath ??= await resolveFileFromDirectory(
      options.inputDir,
      [
        "place-rating-summary.sidecar.json",
        "place_rating_summary.sidecar.json",
      ],
      false,
    );
  }

  if (
    !resolved.placeArtifactPath ||
    !resolved.mediaAssetsSidecarPath ||
    !resolved.placeRatingSourcesSidecarPath
  ) {
    throw new Error(
      "Provide --input-dir or the explicit --place-artifact, --media-sidecar, and --rating-sources-sidecar paths.",
    );
  }

  return {
    mediaAssetsSidecarPath: resolved.mediaAssetsSidecarPath,
    placeArtifactPath: resolved.placeArtifactPath,
    placeRatingSourcesSidecarPath: resolved.placeRatingSourcesSidecarPath,
    placeRatingSummarySidecarPath: resolved.placeRatingSummarySidecarPath,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const paths = await resolveArtifactPaths(options);
  const summary = await runImportIngestPlaceBridgeFromPaths({
    ...paths,
    dryRun: !options.apply,
    logger: {
      info(message) {
        console.log(message);
      },
      warn(message) {
        console.warn(message);
      },
    },
  });

  console.log("\n## Import mode");
  console.log(`- ${summary.dryRun ? "dry-run" : "apply"}`);

  console.log("\n## Place match");
  console.log(`- matchedPlaceId: ${summary.matchedPlaceId ?? "none"}`);
  console.log(`- matchedPlaceSlug: ${summary.matchedPlaceSlug ?? "none"}`);
  console.log(`- matchStrategy: ${summary.matchStrategy ?? "none"}`);

  console.log("\n## Summary");
  console.log(`- placesResolved: ${summary.placesResolved}`);
  console.log(`- placesSkippedUnresolved: ${summary.placesSkippedUnresolved}`);
  console.log(`- mediaCreated: ${summary.mediaCreated}`);
  console.log(`- mediaUpdated: ${summary.mediaUpdated}`);
  console.log(`- mediaUnchanged: ${summary.mediaUnchanged}`);
  console.log(`- ratingSourcesCreated: ${summary.ratingSourcesCreated}`);
  console.log(`- ratingSourcesUpdated: ${summary.ratingSourcesUpdated}`);
  console.log(`- ratingSourcesUnchanged: ${summary.ratingSourcesUnchanged}`);
  console.log(`- ratingSourcesSkipped: ${summary.ratingSourcesSkipped}`);
  console.log(
    `- placeImageSummariesUpdated: ${summary.placeImageSummariesUpdated}`,
  );
  console.log(
    `- placeRatingSummariesUpdated: ${summary.placeRatingSummariesUpdated}`,
  );

  if (summary.warnings.length > 0) {
    console.log("\n## Warnings");
    for (const warning of summary.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
