import {
  ImageSetStatus,
  MediaAssetRole,
  MediaAssetStatus,
  MediaRightsStatus,
  PlaceRatingSourceStatus,
  Prisma,
  RatingSourceProvider,
  ReviewTextRightsStatus,
} from "@prisma/client";
import { vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { importIngestPlaceBridge } from "@/server/importers/ingest-place-bridge";
import { resolvePlaceForIngest } from "@/server/importers/resolve-place-for-ingest";

function createFakePrisma() {
  const state = {
    placeSources: [
      {
        place: {
          id: "place-1",
          name: "Cafe Test",
          slug: "cafe-test-berlin",
        },
        sourceUrl: "https://maps.google.com/?cid=123",
      },
    ],
    places: [
      {
        id: "place-1",
        displayRatingCount: null,
        displayRatingValue: null,
        fallbackImageAssetId: null,
        imageSetStatus: ImageSetStatus.MISSING,
        name: "Cafe Test",
        primaryImageAssetId: null,
        ratingSourceCount: 0,
        ratingSummaryUpdatedAt: null,
        slug: "cafe-test-berlin",
        websiteUrl: "https://cafetest.example.com/",
      },
    ],
    mediaAssets: [] as Array<{
      altText: string | null;
      assetUrl: string;
      attributionText: string | null;
      attributionUrl: string | null;
      externalRef: string | null;
      id: string;
      observedAt: Date | null;
      placeId: string;
      rightsStatus: MediaRightsStatus;
      role: MediaAssetRole;
      sortOrder: number;
      sourceId: string | null;
      sourceProvider: string;
      sourceUrl: string | null;
      status: MediaAssetStatus;
    }>,
    placeRatingSources: [] as Array<{
      attributionText: string | null;
      attributionUrl: string | null;
      externalRef: string | null;
      id: string;
      isIncludedInDisplay: boolean;
      observedAt: Date | null;
      placeId: string;
      provider: RatingSourceProvider;
      ratingCount: number;
      ratingValue: Prisma.Decimal;
      reviewTextRightsStatus: ReviewTextRightsStatus;
      scaleMax: Prisma.Decimal;
      sourceId: string | null;
      sourceUrl: string | null;
      status: PlaceRatingSourceStatus;
    }>,
    sources: [
      {
        id: "source-1",
        url: "https://maps.google.com/?cid=123",
      },
    ],
  };

  let mediaCounter = 0;
  let ratingCounter = 0;

  type FakePrisma = {
    $transaction<T>(callback: (tx: FakePrisma) => Promise<T>): Promise<T>;
    mediaAsset: {
      create(args: {
        data: Omit<(typeof state.mediaAssets)[number], "id">;
      }): Promise<(typeof state.mediaAssets)[number]>;
      findMany(args: { where: { placeId: string } }): Promise<
        (typeof state.mediaAssets)[number][]
      >;
      update(args: {
        where: { id: string };
        data: Partial<Omit<(typeof state.mediaAssets)[number], "id">>;
      }): Promise<(typeof state.mediaAssets)[number]>;
    };
    place: {
      findMany(args: { where: { websiteUrl: string } }): Promise<
        Array<{ id: string; name: string; slug: string }>
      >;
      findUnique(args: {
        where: { id: string };
      }): Promise<(typeof state.places)[number] | null>;
      update(args: {
        where: { id: string };
        data: Partial<(typeof state.places)[number]>;
      }): Promise<{ id: string }>;
    };
    placeRatingSource: {
      create(args: {
        data: Omit<(typeof state.placeRatingSources)[number], "id"> & {
          ratingValue: number;
          scaleMax: number;
        };
      }): Promise<(typeof state.placeRatingSources)[number]>;
      findMany(args: { where: { placeId: string } }): Promise<
        (typeof state.placeRatingSources)[number][]
      >;
      update(args: {
        where: { id: string };
        data: Partial<Omit<(typeof state.placeRatingSources)[number], "id">> & {
          ratingValue?: number;
          scaleMax?: number;
        };
      }): Promise<(typeof state.placeRatingSources)[number]>;
    };
    placeSource: {
      findMany(args: { where: { sourceUrl: string } }): Promise<
        (typeof state.placeSources)[number][]
      >;
    };
    source: {
      findUnique(args: { where: { url: string } }): Promise<{
        id: string;
        url: string;
      } | null>;
    };
    state: typeof state;
  };

  const fake = {} as FakePrisma;

  fake.state = state;
  fake.$transaction = async <T>(callback: (tx: FakePrisma) => Promise<T>) =>
    callback(fake);
  fake.placeSource = {
    async findMany(args: { where: { sourceUrl: string } }) {
      return state.placeSources.filter(
        (item) => item.sourceUrl === args.where.sourceUrl,
      );
    },
  };
  fake.place = {
    async findMany(args: { where: { websiteUrl: string } }) {
      return state.places
        .filter((item) => item.websiteUrl === args.where.websiteUrl)
        .map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
        }));
    },
    async findUnique(args: { where: { id: string } }) {
      return state.places.find((item) => item.id === args.where.id) ?? null;
    },
    async update(args: {
      where: { id: string };
      data: Partial<(typeof state.places)[number]>;
    }) {
      const place = state.places.find((item) => item.id === args.where.id);
      if (!place) {
        throw new Error("place not found");
      }

      Object.assign(place, args.data);
      return { id: place.id };
    },
  };
  fake.mediaAsset = {
    async findMany(args: { where: { placeId: string } }) {
      return state.mediaAssets.filter(
        (item) => item.placeId === args.where.placeId,
      );
    },
    async create(args: {
      data: Omit<(typeof state.mediaAssets)[number], "id">;
    }) {
      mediaCounter += 1;
      const created = {
        id: `media-${mediaCounter}`,
        ...args.data,
      };
      state.mediaAssets.push(created);
      return created;
    },
    async update(args: {
      where: { id: string };
      data: Partial<Omit<(typeof state.mediaAssets)[number], "id">>;
    }) {
      const existing = state.mediaAssets.find(
        (item) => item.id === args.where.id,
      );
      if (!existing) {
        throw new Error("media asset not found");
      }

      Object.assign(existing, args.data);
      return existing;
    },
  };
  fake.placeRatingSource = {
    async findMany(args: { where: { placeId: string } }) {
      return state.placeRatingSources.filter(
        (item) => item.placeId === args.where.placeId,
      );
    },
    async create(args: {
      data: Omit<(typeof state.placeRatingSources)[number], "id"> & {
        ratingValue: number;
        scaleMax: number;
      };
    }) {
      ratingCounter += 1;
      const created = {
        id: `rating-${ratingCounter}`,
        ...args.data,
        ratingValue: new Prisma.Decimal(args.data.ratingValue),
        scaleMax: new Prisma.Decimal(args.data.scaleMax),
      };
      state.placeRatingSources.push(created);
      return created;
    },
    async update(args: {
      where: { id: string };
      data: Partial<Omit<(typeof state.placeRatingSources)[number], "id">> & {
        ratingValue?: number;
        scaleMax?: number;
      };
    }) {
      const existing = state.placeRatingSources.find(
        (item) => item.id === args.where.id,
      );
      if (!existing) {
        throw new Error("rating source not found");
      }

      Object.assign(existing, {
        ...args.data,
        ratingValue:
          args.data.ratingValue == null
            ? existing.ratingValue
            : new Prisma.Decimal(args.data.ratingValue),
        scaleMax:
          args.data.scaleMax == null
            ? existing.scaleMax
            : new Prisma.Decimal(args.data.scaleMax),
      });
      return existing;
    },
  };
  fake.source = {
    async findUnique(args: { where: { url: string } }) {
      return state.sources.find((item) => item.url === args.where.url) ?? null;
    },
  };

  return fake;
}

describe("importIngestPlaceBridge", () => {
  it("is idempotent on rerun for identical artifacts", async () => {
    const fakePrisma = createFakePrisma();
    const artifacts = {
      mediaAssets: [
        {
          assetUrl: "https://cdn.example.com/cafe-test.jpg",
          sourceProvider: "GOOGLE" as const,
          sourceId: undefined,
          sourceUrl: "https://maps.google.com/?cid=123",
          externalRef: "photo-1",
          role: MediaAssetRole.PRIMARY_CANDIDATE,
          status: MediaAssetStatus.ACTIVE,
          rightsStatus: MediaRightsStatus.DISPLAY_ALLOWED,
          attributionText: "Google Maps",
          attributionUrl: "https://maps.google.com/?cid=123",
          altText: "Cafe Test front view",
          sortOrder: 0,
          observedAt: new Date("2026-03-27T10:00:00.000Z"),
        },
      ],
      placeArtifact: {
        artifactType: "place-import-ready" as const,
        schemaVersion: "v1" as const,
        place: {
          sourceUrl: "https://maps.google.com/?cid=123",
          websiteUrl: "https://cafetest.example.com/",
        },
        ratingSummary: {
          averageRating: 4.4,
          reviewCountTotal: 84,
          sourceCount: 1,
          observedAt: new Date("2026-03-27T11:00:00.000Z"),
          calculatedAt: undefined,
          updatedAt: undefined,
        },
      },
      placeRatingSources: [
        {
          provider: RatingSourceProvider.GOOGLE,
          sourceId: undefined,
          sourceUrl: "https://maps.google.com/?cid=123",
          externalRef: "google-place-123",
          status: PlaceRatingSourceStatus.ACTIVE,
          ratingValue: 4.4,
          ratingCount: 84,
          scaleMax: 5,
          isIncludedInDisplay: true,
          observedAt: new Date("2026-03-27T11:00:00.000Z"),
          attributionText: "Google Maps",
          attributionUrl: "https://maps.google.com/?cid=123",
          reviewTextRightsStatus: ReviewTextRightsStatus.NOT_STORED,
        },
      ],
      placeRatingSummary: {
        averageRating: 4.4,
        reviewCountTotal: 84,
        sourceCount: 1,
        observedAt: new Date("2026-03-27T11:00:00.000Z"),
        calculatedAt: undefined,
        updatedAt: undefined,
      },
    };

    const firstRun = await importIngestPlaceBridge({
      artifacts,
      dryRun: false,
      prismaClient: fakePrisma as never,
    });
    const secondRun = await importIngestPlaceBridge({
      artifacts,
      dryRun: false,
      prismaClient: fakePrisma as never,
    });

    expect(firstRun.mediaCreated).toBe(1);
    expect(firstRun.ratingSourcesCreated).toBe(1);
    expect(firstRun.placeImageSummariesUpdated).toBe(1);
    expect(firstRun.placeRatingSummariesUpdated).toBe(1);

    expect(secondRun.mediaCreated).toBe(0);
    expect(secondRun.mediaUpdated).toBe(0);
    expect(secondRun.mediaUnchanged).toBe(1);
    expect(secondRun.ratingSourcesCreated).toBe(0);
    expect(secondRun.ratingSourcesUpdated).toBe(0);
    expect(secondRun.ratingSourcesUnchanged).toBe(1);
    expect(secondRun.placeImageSummariesUpdated).toBe(0);
    expect(secondRun.placeRatingSummariesUpdated).toBe(0);

    expect(fakePrisma.state.mediaAssets).toHaveLength(1);
    expect(fakePrisma.state.placeRatingSources).toHaveLength(1);
    expect(fakePrisma.state.places[0]).toMatchObject({
      displayRatingCount: 84,
      imageSetStatus: ImageSetStatus.REAL_IMAGE_AVAILABLE,
      ratingSourceCount: 1,
    });
    expect(Number(fakePrisma.state.places[0].displayRatingValue)).toBe(4.4);
  });

  it("skips unresolved places instead of guessing by name", async () => {
    const resolved = await resolvePlaceForIngest({
      placeArtifact: {
        artifactType: "place-import-ready",
        schemaVersion: "v1",
        place: {
          name: "Cafe Test",
          sourceUrl: "https://maps.google.com/?cid=999",
          websiteUrl: "https://not-found.example.com/",
        },
        ratingSummary: null,
      },
      prismaClient: createFakePrisma() as never,
    });

    expect(resolved).toBeNull();
  });
});
