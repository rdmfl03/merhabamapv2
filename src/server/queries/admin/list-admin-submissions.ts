import { prisma } from "@/lib/prisma";

type SubmissionPayload = {
  kind?: string;
  name?: string;
  title?: string;
  description?: string;
  startsAt?: string;
  rawDatetimeText?: string;
  time?: string;
  note?: string;
  addressLine1?: string;
  venueName?: string;
  rawLocationText?: string;
  citySlug?: string;
  cityGuess?: string;
  sourceCategory?: string;
  mappedCategory?: string;
  normalizedEventId?: string;
  rawIngestItemId?: string;
};

function parsePayload(payloadJson: string): SubmissionPayload {
  try {
    const parsed = JSON.parse(payloadJson);
    return parsed && typeof parsed === "object" ? (parsed as SubmissionPayload) : {};
  } catch {
    return {};
  }
}

function normalizeKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export async function listAdminSubmissions() {
  const submissions = await prisma.submission.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      submissionType: true,
      status: true,
      targetEntityType: true,
      targetEntityId: true,
      normalizedIngestEventId: true,
      submittedByUserId: true,
      payloadJson: true,
      sourceUrl: true,
      notes: true,
      reviewedByUserId: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const placeIds = submissions.flatMap((submission) =>
    submission.targetEntityType === "PLACE" && submission.targetEntityId
      ? [submission.targetEntityId]
      : [],
  );
  const eventIds = submissions.flatMap((submission) =>
    submission.targetEntityType === "EVENT" && submission.targetEntityId
      ? [submission.targetEntityId]
      : [],
  );
  const normalizedIngestEventIds = submissions.flatMap((submission) =>
    submission.normalizedIngestEventId ? [submission.normalizedIngestEventId] : [],
  );

  const [places, events, normalizedIngestEvents] = await Promise.all([
    placeIds.length
      ? prisma.place.findMany({
          where: {
            id: {
              in: placeIds,
            },
          },
          select: {
            id: true,
            name: true,
            descriptionDe: true,
            descriptionTr: true,
            addressLine1: true,
            websiteUrl: true,
            city: {
              select: {
                slug: true,
                nameDe: true,
                nameTr: true,
              },
            },
            category: {
              select: {
                nameDe: true,
                nameTr: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    eventIds.length
      ? prisma.event.findMany({
          where: {
            id: {
              in: eventIds,
            },
          },
          select: {
            id: true,
            title: true,
            descriptionDe: true,
            descriptionTr: true,
            venueName: true,
            addressLine1: true,
            externalUrl: true,
            category: true,
            city: {
              select: {
                slug: true,
                nameDe: true,
                nameTr: true,
              },
            },
          },
        })
      : Promise.resolve([]),
    normalizedIngestEventIds.length
      ? prisma.normalizedIngestEvent.findMany({
          where: {
            id: {
              in: normalizedIngestEventIds,
            },
          },
          select: {
            id: true,
            normalizationStatus: true,
            title: true,
            description: true,
            category: true,
            venueName: true,
            startsAt: true,
            sourceUrl: true,
            sourceCategory: true,
            reviewedAt: true,
            reviewedByUserId: true,
            promotedAt: true,
            reviewNote: true,
            eventId: true,
            rawIngestItem: {
              select: {
                id: true,
                rawTitle: true,
                rawDatetimeText: true,
                rawLocationText: true,
                cityGuess: true,
                sourceUrl: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const placeById = new Map(places.map((place) => [place.id, place]));
  const eventById = new Map(events.map((event) => [event.id, event]));
  const normalizedIngestEventById = new Map(
    normalizedIngestEvents.map((normalizedEvent) => [normalizedEvent.id, normalizedEvent]),
  );

  const placeDuplicateCounts = new Map<string, number>();
  for (const place of places) {
    const key = `${normalizeKey(place.name)}::${place.city.slug}`;
    placeDuplicateCounts.set(key, (placeDuplicateCounts.get(key) ?? 0) + 1);
  }

  const eventDuplicateCounts = new Map<string, number>();
  for (const event of events) {
    const key = `${normalizeKey(event.title)}::${event.city.slug}`;
    eventDuplicateCounts.set(key, (eventDuplicateCounts.get(key) ?? 0) + 1);
  }

  return submissions.map((submission) => {
    const payload = parsePayload(submission.payloadJson);
    const place =
      submission.targetEntityType === "PLACE" && submission.targetEntityId
        ? placeById.get(submission.targetEntityId)
        : null;
    const event =
      submission.targetEntityType === "EVENT" && submission.targetEntityId
        ? eventById.get(submission.targetEntityId)
        : null;
    const normalizedIngestEvent = submission.normalizedIngestEventId
      ? normalizedIngestEventById.get(submission.normalizedIngestEventId)
      : null;

    const label = place?.name ?? event?.title ?? payload.name ?? payload.title ?? submission.id;
    const sourceUrl = submission.sourceUrl ?? place?.websiteUrl ?? event?.externalUrl ?? null;
    const description =
      place?.descriptionDe ??
      place?.descriptionTr ??
      event?.descriptionDe ??
      event?.descriptionTr ??
      payload.description ??
      null;
    const compactPayloadSummary = event
      ? [payload.venueName ?? event.venueName, payload.addressLine1 ?? event.addressLine1]
          .filter(Boolean)
          .join(" · ")
      : submission.targetEntityType === "EVENT"
        ? [payload.venueName, payload.startsAt, payload.rawIngestItemId]
            .filter(Boolean)
            .join(" · ")
        : [payload.addressLine1 ?? place?.addressLine1].filter(Boolean).join(" · ");

    const reviewSignals: string[] = [];

    if (!sourceUrl) {
      reviewSignals.push("missing_source");
    }

    if (!description || description.trim().length < 40) {
      reviewSignals.push("short_description");
    }

    if (submission.targetEntityType === "EVENT" && !payload.time && !payload.startsAt) {
      reviewSignals.push("event_missing_time");
    }

    if (place) {
      const duplicateKey = `${normalizeKey(place.name)}::${place.city.slug}`;
      if ((placeDuplicateCounts.get(duplicateKey) ?? 0) > 1) {
        reviewSignals.push("possible_duplicate");
      }
    }

    if (event) {
      const duplicateKey = `${normalizeKey(event.title)}::${event.city.slug}`;
      if ((eventDuplicateCounts.get(duplicateKey) ?? 0) > 1) {
        reviewSignals.push("possible_duplicate");
      }
    }

    return {
      id: submission.id,
      submissionType: submission.submissionType,
      status: submission.status,
      targetEntityType: submission.targetEntityType,
      targetEntityId: submission.targetEntityId,
      normalizedIngestEventId: submission.normalizedIngestEventId,
      submittedByUserId: submission.submittedByUserId,
      reviewedByUserId: submission.reviewedByUserId,
      reviewedAt: submission.reviewedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      label,
      citySlug: place?.city.slug ?? event?.city.slug ?? payload.citySlug ?? null,
      cityNameDe: place?.city.nameDe ?? event?.city.nameDe ?? payload.citySlug ?? null,
      cityNameTr: place?.city.nameTr ?? event?.city.nameTr ?? payload.citySlug ?? null,
      categoryLabelDe: place?.category.nameDe ?? event?.category ?? payload.mappedCategory ?? null,
      categoryLabelTr: place?.category.nameTr ?? event?.category ?? payload.mappedCategory ?? null,
      addressOrVenue:
        place?.addressLine1 ?? event?.venueName ?? event?.addressLine1 ?? payload.venueName ?? null,
      descriptionPreview: description,
      notes: submission.notes ?? payload.note ?? null,
      compactPayloadSummary: compactPayloadSummary || null,
      sourceUrl,
      sourcePresent: Boolean(sourceUrl),
      origin: submission.submittedByUserId ? "user_submission" : "system_submission",
      normalizedIngestEventStatus: normalizedIngestEvent?.normalizationStatus ?? null,
      normalizedIngestEventReviewedAt: normalizedIngestEvent?.reviewedAt ?? null,
      normalizedIngestEventReviewedByUserId: normalizedIngestEvent?.reviewedByUserId ?? null,
      normalizedIngestEventPromotedAt: normalizedIngestEvent?.promotedAt ?? null,
      normalizedIngestEventReviewNote: normalizedIngestEvent?.reviewNote ?? null,
      normalizedIngestEventTitle: normalizedIngestEvent?.title ?? payload.title ?? null,
      normalizedIngestEventDescription:
        normalizedIngestEvent?.description ?? payload.description ?? null,
      normalizedIngestEventCategory:
        normalizedIngestEvent?.category ?? payload.mappedCategory ?? null,
      normalizedIngestEventVenueName: normalizedIngestEvent?.venueName ?? payload.venueName ?? null,
      normalizedIngestEventStartsAt:
        normalizedIngestEvent?.startsAt?.toISOString() ?? payload.startsAt ?? null,
      normalizedIngestEventSourceUrl: normalizedIngestEvent?.sourceUrl ?? sourceUrl,
      normalizedIngestEventSourceCategory:
        normalizedIngestEvent?.sourceCategory ?? payload.sourceCategory ?? null,
      normalizedIngestEventEventId:
        normalizedIngestEvent?.eventId ?? submission.targetEntityId ?? null,
      rawIngestItemId: payload.rawIngestItemId ?? normalizedIngestEvent?.rawIngestItem.id ?? null,
      rawIngestItemTitle: normalizedIngestEvent?.rawIngestItem.rawTitle ?? payload.title ?? null,
      rawIngestItemDatetimeText:
        normalizedIngestEvent?.rawIngestItem.rawDatetimeText ?? payload.rawDatetimeText ?? null,
      rawIngestItemLocationText:
        normalizedIngestEvent?.rawIngestItem.rawLocationText ?? payload.rawLocationText ?? null,
      rawIngestItemCityGuess:
        normalizedIngestEvent?.rawIngestItem.cityGuess ?? payload.cityGuess ?? payload.citySlug ?? null,
      rawIngestItemSourceUrl:
        normalizedIngestEvent?.rawIngestItem.sourceUrl ?? sourceUrl ?? null,
      needsNormalizedIngestReview:
        submission.targetEntityType === "EVENT" &&
        !submission.targetEntityId &&
        (normalizedIngestEvent?.normalizationStatus === "PENDING_REVIEW" ||
          normalizedIngestEvent?.normalizationStatus === "APPROVED_FOR_PROMOTION"),
      targetAdminPath:
        submission.targetEntityType === "PLACE" && submission.targetEntityId
          ? `/admin/places/${submission.targetEntityId}`
          : submission.targetEntityType === "EVENT" && submission.targetEntityId
            ? `/admin/events/${submission.targetEntityId}`
            : null,
      reviewSignals,
      hasWarnings: reviewSignals.length > 0,
    };
  });
}
