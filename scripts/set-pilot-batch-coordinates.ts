import { PrismaClient } from "@prisma/client";

import {
  PILOT_BATCH_V1,
  PILOT_BATCH_V1_EVENT_SLUGS,
  PILOT_BATCH_V1_PLACE_SLUGS,
} from "../src/config/pilot-batch-v1";

const prisma = new PrismaClient();

type CliOptions = {
  apply: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  let apply = false;

  for (const arg of argv) {
    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg === "--dry-run") {
      apply = false;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { apply };
}

function printHeading(label: string) {
  console.log(`\n## ${label}`);
}

function printList(items: readonly string[]) {
  if (items.length === 0) {
    console.log("- none");
    return;
  }

  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function formatCoordinatePair(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return "null";
  }

  return `${latitude}, ${longitude}`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const [places, events] = await Promise.all([
    prisma.place.findMany({
      where: {
        slug: { in: [...PILOT_BATCH_V1_PLACE_SLUGS] },
      },
      select: {
        id: true,
        slug: true,
        isPublished: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { slug: "asc" },
    }),
    prisma.event.findMany({
      where: {
        slug: { in: [...PILOT_BATCH_V1_EVENT_SLUGS] },
      },
      select: {
        id: true,
        slug: true,
        isPublished: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { slug: "asc" },
    }),
  ]);

  const placeManifest = new Map(
    PILOT_BATCH_V1.places.map((place) => [place.slug, place] as const),
  );
  const eventManifest = new Map(
    PILOT_BATCH_V1.events.map((event) => [event.slug, event] as const),
  );

  const missingPlaceSlugs = PILOT_BATCH_V1_PLACE_SLUGS.filter(
    (slug) => !places.some((place) => place.slug === slug),
  );
  const missingEventSlugs = PILOT_BATCH_V1_EVENT_SLUGS.filter(
    (slug) => !events.some((event) => event.slug === slug),
  );

  const unpublishedPlaces = places.filter((place) => !place.isPublished);
  const unpublishedEvents = events.filter((event) => !event.isPublished);

  const incompleteManifestEntries = [
    ...PILOT_BATCH_V1.places
      .filter((place) => place.latitude === null || place.longitude === null)
      .map((place) => `place:${place.slug}`),
    ...PILOT_BATCH_V1.events
      .filter((event) => event.latitude === null || event.longitude === null)
      .map((event) => `event:${event.slug}`),
  ];

  printHeading("Execution mode");
  console.log(`- command mode: ${options.apply ? "apply" : "dry-run"}`);
  console.log("- only the published pilot batch slugs are targeted");
  console.log("- the script updates latitude/longitude only");

  printHeading("Targeted place records");
  printList(
    places.map((place) => {
      const manifest = placeManifest.get(place.slug)!;
      return `${place.slug} (published=${place.isPublished}; current=${formatCoordinatePair(place.latitude, place.longitude)}; target=${formatCoordinatePair(manifest.latitude, manifest.longitude)})`;
    }),
  );

  printHeading("Targeted event records");
  printList(
    events.map((event) => {
      const manifest = eventManifest.get(event.slug)!;
      return `${event.slug} (published=${event.isPublished}; current=${formatCoordinatePair(event.latitude, event.longitude)}; target=${formatCoordinatePair(manifest.latitude, manifest.longitude)})`;
    }),
  );

  printHeading("Missing target records");
  printList([
    ...missingPlaceSlugs.map((slug) => `place:${slug}`),
    ...missingEventSlugs.map((slug) => `event:${slug}`),
  ]);

  printHeading("Unpublished target records");
  printList([
    ...unpublishedPlaces.map((place) => `place:${place.slug}`),
    ...unpublishedEvents.map((event) => `event:${event.slug}`),
  ]);

  printHeading("Incomplete manifest coordinates");
  printList(incompleteManifestEntries);

  if (!options.apply) {
    printHeading("Dry-run result");
    console.log("- no database writes were performed");
    console.log("- run with --apply only if there are no missing target records, no unpublished target records, and no incomplete manifest coordinates");
    return;
  }

  if (missingPlaceSlugs.length > 0 || missingEventSlugs.length > 0) {
    throw new Error(
      [
        "Coordinate apply blocked because some published pilot records are missing:",
        ...missingPlaceSlugs.map((slug) => `- place:${slug}`),
        ...missingEventSlugs.map((slug) => `- event:${slug}`),
      ].join("\n"),
    );
  }

  if (unpublishedPlaces.length > 0 || unpublishedEvents.length > 0) {
    throw new Error(
      [
        "Coordinate apply blocked because some target records are not currently published:",
        ...unpublishedPlaces.map((place) => `- place:${place.slug}`),
        ...unpublishedEvents.map((event) => `- event:${event.slug}`),
      ].join("\n"),
    );
  }

  if (incompleteManifestEntries.length > 0) {
    throw new Error(
      [
        "Coordinate apply blocked because some manifest entries are missing coordinates:",
        ...incompleteManifestEntries.map((entry) => `- ${entry}`),
      ].join("\n"),
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const place of places) {
      const manifest = placeManifest.get(place.slug)!;

      await tx.place.update({
        where: { id: place.id },
        data: {
          latitude: manifest.latitude,
          longitude: manifest.longitude,
        },
      });
    }

    for (const event of events) {
      const manifest = eventManifest.get(event.slug)!;

      await tx.event.update({
        where: { id: event.id },
        data: {
          latitude: manifest.latitude,
          longitude: manifest.longitude,
        },
      });
    }
  });

  printHeading("Apply result");
  console.log("- targeted pilot batch coordinates were updated");
  console.log("- no unrelated records were changed");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
