import { prisma } from "@/lib/prisma";
import {
  deriveRawEventCityGuessFromText,
  deriveRawEventDatetimeTextFromText,
  deriveRawEventLocationTextFromText,
} from "@/config/ingest-allowlist";

export async function getAdminStagedEventIngestOverview() {
  const [
    rawEventItems,
    rawEventItemsStaged,
    stagedEvents,
  ] = await Promise.all([
    prisma.rawIngestItem.findMany({
      where: {
        entityGuess: "EVENT",
      },
      select: {
        id: true,
        cityGuess: true,
        rawText: true,
        rawDatetimeText: true,
        rawLocationText: true,
      },
    }),
    prisma.rawIngestItem.count({
      where: {
        entityGuess: "EVENT",
        normalizedEvent: {
          isNot: null,
        },
      },
    }),
    prisma.normalizedIngestEvent.findMany({
      select: {
        normalizationStatus: true,
        description: true,
        venueName: true,
        sourceCategory: true,
      },
    }),
  ]);

  const rawEventItemsTotal = rawEventItems.length;
  const rawMissingCityGuess = rawEventItems.filter((item) => {
    const effectiveCityGuess =
      item.cityGuess?.trim() || deriveRawEventCityGuessFromText(item.rawText);
    return !effectiveCityGuess;
  }).length;
  const rawMissingDatetime = rawEventItems.filter((item) => {
    const effectiveRawDatetimeText =
      item.rawDatetimeText ?? deriveRawEventDatetimeTextFromText(item.rawText);
    return !effectiveRawDatetimeText;
  }).length;
  const rawMissingLocation = rawEventItems.filter((item) => {
    const effectiveRawLocationText =
      item.rawLocationText ?? deriveRawEventLocationTextFromText(item.rawText);
    return !effectiveRawLocationText;
  }).length;

  const stagedEventsTotal = stagedEvents.length;
  const countByStatus = new Map<string, number>();

  for (const event of stagedEvents) {
    countByStatus.set(
      event.normalizationStatus,
      (countByStatus.get(event.normalizationStatus) ?? 0) + 1,
    );
  }

  const stagedMissingVenue = stagedEvents.filter((event) => !event.venueName?.trim()).length;
  const stagedMissingSourceCategory = stagedEvents.filter(
    (event) => !event.sourceCategory?.trim(),
  ).length;
  const stagedShortDescription = stagedEvents.filter(
    (event) => !event.description || event.description.trim().length < 40,
  ).length;

  return {
    rawEventItemsTotal,
    rawEventItemsStaged,
    rawEventItemsUnstaged: Math.max(rawEventItemsTotal - rawEventItemsStaged, 0),
    stagedEventsTotal,
    outcomes: {
      pendingReview: countByStatus.get("PENDING_REVIEW") ?? 0,
      approvedForPromotion: countByStatus.get("APPROVED_FOR_PROMOTION") ?? 0,
      promoted: countByStatus.get("PROMOTED") ?? 0,
      rejected: countByStatus.get("REJECTED") ?? 0,
      duplicate: countByStatus.get("DUPLICATE") ?? 0,
      stale: countByStatus.get("STALE") ?? 0,
      superseded: countByStatus.get("SUPERSEDED") ?? 0,
    },
    qualityGaps: {
      rawMissingDatetime,
      rawMissingLocation,
      rawMissingCityGuess,
      stagedMissingVenue,
      stagedMissingSourceCategory,
      stagedShortDescription,
    },
  };
}
