import { PrismaClient } from "@prisma/client";

import {
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

function describeState(record: {
  slug: string;
  isPublished: boolean;
  moderationStatus: string;
}) {
  return `${record.slug} (isPublished=${record.isPublished}, moderationStatus=${record.moderationStatus})`;
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
        moderationStatus: true,
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
        moderationStatus: true,
      },
      orderBy: { slug: "asc" },
    }),
  ]);

  const missingPlaceSlugs = PILOT_BATCH_V1_PLACE_SLUGS.filter(
    (slug) => !places.some((place) => place.slug === slug),
  );
  const missingEventSlugs = PILOT_BATCH_V1_EVENT_SLUGS.filter(
    (slug) => !events.some((event) => event.slug === slug),
  );

  const unexpectedPlaceStates = places.filter(
    (place) => place.isPublished || place.moderationStatus !== "PENDING",
  );
  const unexpectedEventStates = events.filter(
    (event) => event.isPublished || event.moderationStatus !== "PENDING",
  );

  printHeading("Execution mode");
  console.log(`- command mode: ${options.apply ? "apply" : "dry-run"}`);
  console.log(
    "- only the conservative pilot batch 1 slugs are targeted by this script",
  );
  console.log(
    "- the script expects staged drafts to still be isPublished=false and moderationStatus=PENDING",
  );

  printHeading("Targeted place records");
  printList(places.map(describeState));

  printHeading("Targeted event records");
  printList(events.map(describeState));

  printHeading("Missing target records");
  printList([
    ...missingPlaceSlugs.map((slug) => `place:${slug}`),
    ...missingEventSlugs.map((slug) => `event:${slug}`),
  ]);

  printHeading("Unexpected target states");
  printList([
    ...unexpectedPlaceStates.map((place) => `place:${describeState(place)}`),
    ...unexpectedEventStates.map((event) => `event:${describeState(event)}`),
  ]);

  if (!options.apply) {
    printHeading("Dry-run result");
    console.log("- no database writes were performed");
    console.log(
      "- run with --apply only if there are no missing target records and no unexpected target states",
    );
    return;
  }

  if (missingPlaceSlugs.length > 0 || missingEventSlugs.length > 0) {
    throw new Error(
      [
        "Publish apply blocked because some batch 1 records are missing:",
        ...missingPlaceSlugs.map((slug) => `- place:${slug}`),
        ...missingEventSlugs.map((slug) => `- event:${slug}`),
      ].join("\n"),
    );
  }

  if (unexpectedPlaceStates.length > 0 || unexpectedEventStates.length > 0) {
    throw new Error(
      [
        "Publish apply blocked because some batch 1 records are not in the expected staged state:",
        ...unexpectedPlaceStates.map(
          (place) => `- place:${describeState(place)}`,
        ),
        ...unexpectedEventStates.map(
          (event) => `- event:${describeState(event)}`,
        ),
      ].join("\n"),
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.place.updateMany({
      where: {
        id: { in: places.map((place) => place.id) },
      },
      data: {
        isPublished: true,
        moderationStatus: "APPROVED",
      },
    });

    await tx.event.updateMany({
      where: {
        id: { in: events.map((event) => event.id) },
      },
      data: {
        isPublished: true,
        moderationStatus: "APPROVED",
      },
    });
  });

  printHeading("Apply result");
  console.log("- targeted batch 1 places were published");
  console.log("- targeted batch 1 events were published");
  console.log("- no other records were changed");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
