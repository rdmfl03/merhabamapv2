import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { MediaAssetRole, MediaAssetStatus, MediaRightsStatus, PlaceRatingSourceStatus, RatingSourceProvider } from "@prisma/client";

import { readIngestArtifacts } from "@/server/importers/read-ingest-artifacts";

async function writeJsonFile(targetPath: string, payload: unknown) {
  await writeFile(targetPath, JSON.stringify(payload, null, 2), "utf8");
}

describe("readIngestArtifacts", () => {
  it("uses import-ready rating summary as fallback when summary sidecar is absent", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "merhabamap-artifacts-"));

    try {
      const placeArtifactPath = path.join(tempDir, "place-import-ready.json");
      const mediaAssetsSidecarPath = path.join(
        tempDir,
        "media-assets.sidecar.json",
      );
      const placeRatingSourcesSidecarPath = path.join(
        tempDir,
        "place-rating-sources.sidecar.json",
      );

      await writeJsonFile(placeArtifactPath, {
        artifactType: "place-import-ready",
        schemaVersion: "v1",
        place: {
          sourceUrl: "https://maps.google.com/?cid=123",
          ratingSummary: {
            averageRating: 4.4,
            reviewCountTotal: 84,
            sourceCount: 2,
            observedAt: "2026-03-27T10:00:00.000Z",
          },
        },
      });
      await writeJsonFile(mediaAssetsSidecarPath, {
        artifactType: "media-assets-sidecar",
        schemaVersion: "v1",
        items: [
          {
            assetUrl: "https://cdn.example.com/place.jpg",
            sourceProvider: "GOOGLE",
            role: MediaAssetRole.PRIMARY_CANDIDATE,
            status: MediaAssetStatus.ACTIVE,
            rightsStatus: MediaRightsStatus.DISPLAY_ALLOWED,
            sortOrder: 0,
          },
        ],
      });
      await writeJsonFile(placeRatingSourcesSidecarPath, {
        artifactType: "place-rating-sources-sidecar",
        schemaVersion: "v1",
        items: [
          {
            provider: RatingSourceProvider.GOOGLE,
            sourceUrl: "https://maps.google.com/?cid=123",
            status: PlaceRatingSourceStatus.ACTIVE,
            ratingValue: 4.4,
            ratingCount: 84,
            scaleMax: 5,
            isIncludedInDisplay: true,
          },
        ],
      });

      const artifacts = await readIngestArtifacts({
        mediaAssetsSidecarPath,
        placeArtifactPath,
        placeRatingSourcesSidecarPath,
      });

      expect(artifacts.placeRatingSummary).toMatchObject({
        averageRating: 4.4,
        reviewCountTotal: 84,
        sourceCount: 2,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("fails closed on invalid sidecar shapes", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "merhabamap-artifacts-"));

    try {
      const placeArtifactPath = path.join(tempDir, "place-import-ready.json");
      const mediaAssetsSidecarPath = path.join(
        tempDir,
        "media-assets.sidecar.json",
      );
      const placeRatingSourcesSidecarPath = path.join(
        tempDir,
        "place-rating-sources.sidecar.json",
      );

      await writeJsonFile(placeArtifactPath, {
        artifactType: "place-import-ready",
        schemaVersion: "v1",
        place: {
          sourceUrl: "https://maps.google.com/?cid=123",
        },
      });
      await writeJsonFile(mediaAssetsSidecarPath, {
        artifactType: "media-assets-sidecar",
        items: [],
      });
      await writeJsonFile(placeRatingSourcesSidecarPath, {
        artifactType: "place-rating-sources-sidecar",
        schemaVersion: "v1",
        items: [],
      });

      await expect(
        readIngestArtifacts({
          mediaAssetsSidecarPath,
          placeArtifactPath,
          placeRatingSourcesSidecarPath,
        }),
      ).rejects.toThrow(/media assets sidecar is invalid/i);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
