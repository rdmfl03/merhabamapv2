import { randomUUID } from "node:crypto";

import { Prisma, PrismaClient } from "@prisma/client";

import {
  PILOT_BATCH_V1,
  SEEDED_PUBLIC_EVENT_SLUGS,
  SEEDED_PUBLIC_PLACE_SLUGS,
  type PilotEventRecord,
  type PilotPlaceRecord,
} from "../src/config/pilot-batch-v1";

const prisma = new PrismaClient();

type Mode = "stage" | "publish";

type CliOptions = {
  apply: boolean;
  mode: Mode;
};

function parseArgs(argv: string[]): CliOptions {
  let apply = false;
  let mode: Mode = "stage";

  for (const arg of argv) {
    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg === "--dry-run") {
      apply = false;
      continue;
    }

    if (arg.startsWith("--mode=")) {
      const value = arg.slice("--mode=".length);
      if (value === "stage" || value === "publish") {
        mode = value;
        continue;
      }
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { apply, mode };
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

function getMissingStageFieldsForPlace(place: PilotPlaceRecord) {
  const missing: string[] = [];

  if (!place.sourceUrl) {
    missing.push("sourceUrl");
  }

  if (!place.addressLine1) {
    missing.push("addressLine1");
  }

  return missing;
}

function getMissingPublishFieldsForPlace(place: PilotPlaceRecord) {
  const missing = getMissingStageFieldsForPlace(place);

  if (!place.postalCode) {
    missing.push("postalCode");
  }

  if (!place.descriptionDe) {
    missing.push("descriptionDe");
  }

  if (!place.descriptionTr) {
    missing.push("descriptionTr");
  }

  return missing;
}

function getMissingStageFieldsForEvent(event: PilotEventRecord) {
  const missing: string[] = [];

  if (!event.sourceUrl) {
    missing.push("sourceUrl");
  }

  if (!event.addressLine1) {
    missing.push("addressLine1");
  }

  return missing;
}

function getMissingPublishFieldsForEvent(event: PilotEventRecord) {
  const missing = getMissingStageFieldsForEvent(event);

  if (!event.postalCode) {
    missing.push("postalCode");
  }

  if (!event.descriptionDe) {
    missing.push("descriptionDe");
  }

  if (!event.descriptionTr) {
    missing.push("descriptionTr");
  }

  if (!event.externalUrl) {
    missing.push("externalUrl");
  }

  return missing;
}

async function upsertSource(tx: Prisma.TransactionClient, args: {
  sourceUrl: string;
  sourceLabel: string;
  sourceKind: string;
}) {
  return tx.source.upsert({
    where: { url: args.sourceUrl },
    update: {
      name: args.sourceLabel,
      platform: "web",
      sourceKind: args.sourceKind,
      isActive: true,
      isPublic: true,
      lastCheckedAt: new Date(),
    },
    create: {
      id: randomUUID(),
      url: args.sourceUrl,
      name: args.sourceLabel,
      platform: "web",
      sourceKind: args.sourceKind,
      isActive: true,
      isPublic: true,
      trustScore: 50,
      lastCheckedAt: new Date(),
    },
  });
}

async function ensurePlaceSource(args: {
  tx: Prisma.TransactionClient;
  placeId: string;
  sourceUrl: string;
  sourceLabel: string;
  sourceKind: string;
  observedName: string;
  observedAddress: string | null;
  observedWebsite: string | null;
}) {
  const source = await upsertSource(args.tx, {
    sourceUrl: args.sourceUrl,
    sourceLabel: args.sourceLabel,
    sourceKind: args.sourceKind,
  });

  const existing = await args.tx.placeSource.findFirst({
    where: {
      placeId: args.placeId,
      sourceId: source.id,
      sourceUrl: args.sourceUrl,
    },
  });

  if (existing) {
    await args.tx.placeSource.update({
      where: { id: existing.id },
      data: {
        observedName: args.observedName,
        observedAddress: args.observedAddress,
        observedWebsite: args.observedWebsite,
        isPrimary: true,
        lastSeenAt: new Date(),
      },
    });
    return;
  }

  await args.tx.placeSource.create({
    data: {
      id: randomUUID(),
      placeId: args.placeId,
      sourceId: source.id,
      sourceUrl: args.sourceUrl,
      observedName: args.observedName,
      observedAddress: args.observedAddress,
      observedWebsite: args.observedWebsite,
      isPrimary: true,
    },
  });
}

async function ensureEventSource(args: {
  tx: Prisma.TransactionClient;
  eventId: string;
  sourceUrl: string;
  sourceLabel: string;
  sourceKind: string;
  observedTitle: string;
  observedDatetimeText: string;
  observedLocationText: string;
}) {
  const source = await upsertSource(args.tx, {
    sourceUrl: args.sourceUrl,
    sourceLabel: args.sourceLabel,
    sourceKind: args.sourceKind,
  });

  const existing = await args.tx.eventSource.findFirst({
    where: {
      eventId: args.eventId,
      sourceId: source.id,
      sourceUrl: args.sourceUrl,
    },
  });

  if (existing) {
    await args.tx.eventSource.update({
      where: { id: existing.id },
      data: {
        observedTitle: args.observedTitle,
        observedDatetimeText: args.observedDatetimeText,
        observedLocationText: args.observedLocationText,
        isPrimary: true,
        lastSeenAt: new Date(),
      },
    });
    return;
  }

  await args.tx.eventSource.create({
    data: {
      id: randomUUID(),
      eventId: args.eventId,
      sourceId: source.id,
      sourceUrl: args.sourceUrl,
      observedTitle: args.observedTitle,
      observedDatetimeText: args.observedDatetimeText,
      observedLocationText: args.observedLocationText,
      isPrimary: true,
    },
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const publishMode = options.mode === "publish";

  const cities = await prisma.city.findMany({
    where: { slug: { in: ["berlin", "koeln"] } },
    select: { id: true, slug: true, nameDe: true },
  });
  const categories = await prisma.placeCategory.findMany({
    where: { slug: { in: ["restaurants"] } },
    select: { id: true, slug: true },
  });
  const existingSeededPlaces = await prisma.place.findMany({
    where: { slug: { in: [...SEEDED_PUBLIC_PLACE_SLUGS] } },
    select: { id: true, slug: true, isPublished: true },
  });
  const existingSeededEvents = await prisma.event.findMany({
    where: { slug: { in: [...SEEDED_PUBLIC_EVENT_SLUGS] } },
    select: { id: true, slug: true, isPublished: true },
  });
  const existingPilotPlaces = await prisma.place.findMany({
    where: { slug: { in: PILOT_BATCH_V1.places.map((place) => place.slug) } },
    select: { id: true, slug: true, isPublished: true },
  });
  const existingPilotEvents = await prisma.event.findMany({
    where: { slug: { in: PILOT_BATCH_V1.events.map((event) => event.slug) } },
    select: { id: true, slug: true, isPublished: true },
  });

  const cityBySlug = Object.fromEntries(cities.map((city) => [city.slug, city]));
  const categoryBySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));

  for (const citySlug of ["berlin", "koeln"] as const) {
    if (!cityBySlug[citySlug]) {
      throw new Error(`Missing city row for slug "${citySlug}"`);
    }
  }

  if (!categoryBySlug.restaurants) {
    throw new Error('Missing place category row for slug "restaurants"');
  }

  const placeMissingFields = PILOT_BATCH_V1.places.map((place) => ({
    slug: place.slug,
    missing: publishMode ? getMissingPublishFieldsForPlace(place) : getMissingStageFieldsForPlace(place),
  }));
  const eventMissingFields = PILOT_BATCH_V1.events.map((event) => ({
    slug: event.slug,
    missing: publishMode ? getMissingPublishFieldsForEvent(event) : getMissingStageFieldsForEvent(event),
  }));

  printHeading("Execution mode");
  console.log(`- command mode: ${options.apply ? "apply" : "dry-run"}`);
  console.log(`- rollout mode: ${options.mode}`);
  console.log("- seeded demo records will never be deleted by this script");
  console.log("- demo records are only unpublished to preserve claims, reports, saves, and audit trails");

  printHeading("Seeded public places targeted for unpublish");
  printList(existingSeededPlaces.map((record) => `${record.slug} (${record.isPublished ? "published" : "already hidden"})`));

  printHeading("Seeded public events targeted for unpublish");
  printList(existingSeededEvents.map((record) => `${record.slug} (${record.isPublished ? "published" : "already hidden"})`));

  printHeading("Pilot places targeted for upsert");
  printList(
    PILOT_BATCH_V1.places.map((place) => {
      const existing = existingPilotPlaces.find((record) => record.slug === place.slug);
      const missing = placeMissingFields.find((entry) => entry.slug === place.slug)?.missing ?? [];
      const readiness = missing.length > 0 ? `missing ${missing.join(", ")}` : "ready";
      return `${place.slug} (${existing ? "update" : "insert"}; ${readiness})`;
    }),
  );

  printHeading("Pilot events targeted for upsert");
  printList(
    PILOT_BATCH_V1.events.map((event) => {
      const existing = existingPilotEvents.find((record) => record.slug === event.slug);
      const missing = eventMissingFields.find((entry) => entry.slug === event.slug)?.missing ?? [];
      const readiness = missing.length > 0 ? `missing ${missing.join(", ")}` : "ready";
      return `${event.slug} (${existing ? "update" : "insert"}; ${readiness})`;
    }),
  );

  if (!options.apply) {
    printHeading("Dry-run result");
    console.log("- no database writes were performed");
    console.log("- fill the missing source/location fields in src/config/pilot-batch-v1.ts before any publish attempt");
    return;
  }

  if (publishMode) {
    const incompleteRecords = [
      ...placeMissingFields.filter((entry) => entry.missing.length > 0).map((entry) => `place:${entry.slug} -> ${entry.missing.join(", ")}`),
      ...eventMissingFields.filter((entry) => entry.missing.length > 0).map((entry) => `event:${entry.slug} -> ${entry.missing.join(", ")}`),
    ];

    if (incompleteRecords.length > 0) {
      throw new Error(
        `Publish mode blocked because pilot manifest is incomplete:\n${incompleteRecords.map((item) => `- ${item}`).join("\n")}`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.place.updateMany({
      where: { slug: { in: [...SEEDED_PUBLIC_PLACE_SLUGS] } },
      data: { isPublished: false },
    });

    await tx.event.updateMany({
      where: { slug: { in: [...SEEDED_PUBLIC_EVENT_SLUGS] } },
      data: { isPublished: false },
    });

    for (const place of PILOT_BATCH_V1.places) {
      const stored = await tx.place.upsert({
        where: { slug: place.slug },
        update: {
          name: place.name,
          categoryId: categoryBySlug[place.categorySlug].id,
          cityId: cityBySlug[place.citySlug].id,
          descriptionDe: place.descriptionDe,
          descriptionTr: place.descriptionTr,
          addressLine1: place.addressLine1,
          postalCode: place.postalCode,
          websiteUrl: place.websiteUrl,
          isPublished: publishMode,
          moderationStatus: publishMode ? "APPROVED" : "PENDING",
          verificationStatus: "UNVERIFIED",
          verifiedAt: null,
          verifiedByUserId: null,
        },
        create: {
          slug: place.slug,
          name: place.name,
          categoryId: categoryBySlug[place.categorySlug].id,
          cityId: cityBySlug[place.citySlug].id,
          descriptionDe: place.descriptionDe,
          descriptionTr: place.descriptionTr,
          addressLine1: place.addressLine1,
          postalCode: place.postalCode,
          websiteUrl: place.websiteUrl,
          isPublished: publishMode,
          moderationStatus: publishMode ? "APPROVED" : "PENDING",
          verificationStatus: "UNVERIFIED",
        },
      });

      if (place.sourceUrl) {
        await ensurePlaceSource({
          tx,
          placeId: stored.id,
          sourceUrl: place.sourceUrl,
          sourceLabel: place.sourceLabel,
          sourceKind: place.sourceKind,
          observedName: place.name,
          observedAddress: place.addressLine1,
          observedWebsite: place.websiteUrl,
        });
      }
    }

    for (const event of PILOT_BATCH_V1.events) {
      const stored = await tx.event.upsert({
        where: { slug: event.slug },
        update: {
          title: event.title,
          category: event.category,
          cityId: cityBySlug[event.citySlug].id,
          venueName: event.venueName,
          addressLine1: event.addressLine1,
          postalCode: event.postalCode,
          startsAt: new Date(event.startsAt),
          endsAt: event.endsAt ? new Date(event.endsAt) : null,
          organizerName: event.organizerName,
          externalUrl: event.externalUrl,
          descriptionDe: event.descriptionDe,
          descriptionTr: event.descriptionTr,
          isPublished: publishMode,
          moderationStatus: publishMode ? "APPROVED" : "PENDING",
        },
        create: {
          slug: event.slug,
          title: event.title,
          category: event.category,
          cityId: cityBySlug[event.citySlug].id,
          venueName: event.venueName,
          addressLine1: event.addressLine1,
          postalCode: event.postalCode,
          startsAt: new Date(event.startsAt),
          endsAt: event.endsAt ? new Date(event.endsAt) : null,
          organizerName: event.organizerName,
          externalUrl: event.externalUrl,
          descriptionDe: event.descriptionDe,
          descriptionTr: event.descriptionTr,
          isPublished: publishMode,
          moderationStatus: publishMode ? "APPROVED" : "PENDING",
        },
      });

      if (event.sourceUrl) {
        await ensureEventSource({
          tx,
          eventId: stored.id,
          sourceUrl: event.sourceUrl,
          sourceLabel: event.sourceLabel,
          sourceKind: event.sourceKind,
          observedTitle: event.title,
          observedDatetimeText: event.startsAt,
          observedLocationText: event.venueName,
        });
      }
    }
  });

  printHeading("Apply result");
  console.log("- seeded demo records were unpublished");
  console.log(`- pilot records were ${publishMode ? "published" : "staged as unpublished drafts"}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
