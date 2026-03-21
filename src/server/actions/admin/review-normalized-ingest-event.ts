"use server";

import { revalidatePath } from "next/cache";

import type { NormalizedIngestEventStatus } from "@prisma/client";

import { logAdminAction } from "@/lib/audit/log-admin-action";
import {
  findMatchingEventDuplicate,
  getEventDuplicateSearchWindow,
} from "@/lib/ingest/event-duplicates";
import { prisma } from "@/lib/prisma";
import { buildSlugBase, buildUniqueSlug } from "@/lib/submissions";
import { reviewNormalizedIngestEventSchema } from "@/lib/validators/admin";

import { idleAdminActionState, type AdminActionState } from "./state";
import { requireAdminAccess } from "./shared";

const PROMOTABLE_NORMALIZED_STATUSES: NormalizedIngestEventStatus[] = [
  "PENDING_REVIEW",
  "APPROVED_FOR_PROMOTION",
];

const TERMINAL_STATUS_BY_ACTION: Record<
  "REJECT" | "MARK_DUPLICATE" | "MARK_STALE" | "MARK_SUPERSEDED",
  NormalizedIngestEventStatus
> = {
  REJECT: "REJECTED",
  MARK_DUPLICATE: "DUPLICATE",
  MARK_STALE: "STALE",
  MARK_SUPERSEDED: "SUPERSEDED",
};

export async function reviewNormalizedIngestEvent(
  _previousState: AdminActionState = idleAdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void _previousState;

  const parsed = reviewNormalizedIngestEventSchema.safeParse({
    locale: formData.get("locale"),
    normalizedIngestEventId: formData.get("normalizedIngestEventId"),
    action: formData.get("action"),
    reviewNote: formData.get("reviewNote"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const actor = await requireAdminAccess(parsed.data.locale);
  const normalizedEvent = await prisma.normalizedIngestEvent.findUnique({
    where: { id: parsed.data.normalizedIngestEventId },
    select: {
      id: true,
      eventId: true,
      normalizationStatus: true,
      title: true,
      description: true,
      category: true,
      venueName: true,
      startsAt: true,
      sourceUrl: true,
      sourceCategory: true,
      cityId: true,
      city: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!normalizedEvent) {
    return { status: "error", message: "entity_not_found" };
  }

  const now = new Date();

  if (parsed.data.action === "PROMOTE") {
    if (normalizedEvent.eventId && normalizedEvent.normalizationStatus === "PROMOTED") {
      return { status: "success", message: "staged_ingest_event_promoted" };
    }

    if (!PROMOTABLE_NORMALIZED_STATUSES.includes(normalizedEvent.normalizationStatus)) {
      return { status: "error", message: "invalid_state" };
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM normalized_ingest_events
        WHERE id = ${normalizedEvent.id}
        FOR UPDATE
      `;

      const lockedNormalizedEvent = await tx.normalizedIngestEvent.findUnique({
        where: {
          id: normalizedEvent.id,
        },
        select: {
          id: true,
          eventId: true,
          normalizationStatus: true,
        },
      });

      if (!lockedNormalizedEvent) {
        throw new Error("normalized_ingest_event_not_found");
      }

      if (
        lockedNormalizedEvent.eventId &&
        lockedNormalizedEvent.normalizationStatus === "PROMOTED"
      ) {
        return {
          promoted: true,
          linkedEventId: lockedNormalizedEvent.eventId,
          noOp: true,
        };
      }

      if (!PROMOTABLE_NORMALIZED_STATUSES.includes(lockedNormalizedEvent.normalizationStatus)) {
        throw new Error("normalized_ingest_event_not_promotable");
      }

      await tx.normalizedIngestEvent.update({
        where: {
          id: normalizedEvent.id,
        },
        data: {
          normalizationStatus: "APPROVED_FOR_PROMOTION",
          reviewedByUserId: actor.id,
          reviewedAt: now,
          reviewNote: parsed.data.reviewNote ?? null,
        },
      });

      const existingEventCandidates = await tx.event.findMany({
        where: {
          cityId: normalizedEvent.cityId,
          startsAt: getEventDuplicateSearchWindow(normalizedEvent.startsAt),
        },
        select: {
          id: true,
          title: true,
          venueName: true,
          startsAt: true,
        },
      });
      const existingEvent = findMatchingEventDuplicate(
        {
          title: normalizedEvent.title,
          venueName: normalizedEvent.venueName,
          startsAt: normalizedEvent.startsAt,
        },
        existingEventCandidates,
      );

      if (existingEvent) {
        await tx.normalizedIngestEvent.update({
          where: { id: normalizedEvent.id },
          data: {
            normalizationStatus: "DUPLICATE",
            reviewedByUserId: actor.id,
            reviewedAt: now,
            reviewNote: parsed.data.reviewNote ?? null,
          },
        });

        await tx.submission.updateMany({
          where: {
            normalizedIngestEventId: normalizedEvent.id,
          },
          data: {
            targetEntityId: existingEvent.id,
            status: "DONE",
            reviewedByUserId: actor.id,
            reviewedAt: now,
          },
        });

        return {
          promoted: false,
          linkedEventId: existingEvent.id,
          noOp: false,
        };
      }

      const slugBase = buildSlugBase(`${normalizedEvent.title}-${normalizedEvent.city.slug}`);
      const slug = await buildUniqueSlug(slugBase, async (candidate) => {
        const count = await tx.event.count({
          where: {
            slug: candidate,
          },
        });

        return count > 0;
      });

      const event = await tx.event.create({
        data: {
          slug,
          title: normalizedEvent.title,
          descriptionDe: normalizedEvent.description,
          descriptionTr: normalizedEvent.description,
          category: normalizedEvent.category,
          cityId: normalizedEvent.cityId,
          venueName: normalizedEvent.venueName,
          startsAt: normalizedEvent.startsAt,
          externalUrl: normalizedEvent.sourceUrl,
          moderationStatus: "PENDING",
          isPublished: false,
        },
        select: {
          id: true,
        },
      });

      await tx.normalizedIngestEvent.update({
        where: { id: normalizedEvent.id },
        data: {
          eventId: event.id,
          normalizationStatus: "PROMOTED",
          reviewedByUserId: actor.id,
          reviewedAt: now,
          reviewNote: parsed.data.reviewNote ?? null,
          promotedAt: now,
        },
      });

      await tx.submission.updateMany({
        where: {
          normalizedIngestEventId: normalizedEvent.id,
        },
        data: {
          targetEntityId: event.id,
        },
      });

      return {
        promoted: true,
        linkedEventId: event.id,
        noOp: false,
      };
    });

    if (!result.noOp) {
      await logAdminAction({
        actorUserId: actor.id,
        actionType: result.promoted
          ? "NORMALIZED_INGEST_EVENT_PROMOTED"
          : "NORMALIZED_INGEST_EVENT_MARKED_DUPLICATE",
        targetType: result.promoted ? "EVENT" : "NORMALIZED_INGEST_EVENT",
        targetId: result.promoted ? result.linkedEventId : normalizedEvent.id,
        summary: result.promoted
          ? `Promoted normalized ingest event ${normalizedEvent.id}`
          : `Marked normalized ingest event ${normalizedEvent.id} as duplicate`,
        metadata: {
          normalizedIngestEventId: normalizedEvent.id,
          action: result.promoted ? "PROMOTE" : "MARK_DUPLICATE",
          sourceCategory: normalizedEvent.sourceCategory,
        },
      });
    }

    revalidatePath(`/${parsed.data.locale}/admin/ingest`);
    revalidatePath(`/${parsed.data.locale}/admin/ingest/submissions`);
    revalidatePath(`/${parsed.data.locale}/admin/events`);
    revalidatePath(`/${parsed.data.locale}/admin/events/${result.linkedEventId}`);

    return {
      status: "success",
      message: result.promoted
        ? "staged_ingest_event_promoted"
        : "staged_ingest_event_marked_duplicate",
    };
  }

  if (normalizedEvent.eventId || !PROMOTABLE_NORMALIZED_STATUSES.includes(normalizedEvent.normalizationStatus)) {
    return { status: "error", message: "invalid_state" };
  }

  const nextStatus = TERMINAL_STATUS_BY_ACTION[parsed.data.action];

  const exactEvent = parsed.data.action === "MARK_DUPLICATE"
    ? findMatchingEventDuplicate(
        {
          title: normalizedEvent.title,
          venueName: normalizedEvent.venueName,
          startsAt: normalizedEvent.startsAt,
        },
        await prisma.event.findMany({
        where: {
          cityId: normalizedEvent.cityId,
          startsAt: getEventDuplicateSearchWindow(normalizedEvent.startsAt),
        },
        select: {
          id: true,
          title: true,
          venueName: true,
          startsAt: true,
        },
      }),
      )
    : null;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.normalizedIngestEvent.updateMany({
      where: {
        id: normalizedEvent.id,
        eventId: null,
        normalizationStatus: {
          in: PROMOTABLE_NORMALIZED_STATUSES,
        },
      },
      data: {
        normalizationStatus: nextStatus,
        reviewedByUserId: actor.id,
        reviewedAt: now,
        reviewNote: parsed.data.reviewNote ?? null,
      },
    });

    if (updated.count === 0) {
      throw new Error("normalized_ingest_event_not_reviewable");
    }

    await tx.submission.updateMany({
      where: {
        normalizedIngestEventId: normalizedEvent.id,
      },
      data: {
        targetEntityId: exactEvent?.id ?? null,
        status: parsed.data.action === "MARK_DUPLICATE" && exactEvent ? "DONE" : "REJECTED",
        reviewedByUserId: actor.id,
        reviewedAt: now,
      },
    });
  });

  await logAdminAction({
    actorUserId: actor.id,
    actionType: "NORMALIZED_INGEST_EVENT_REVIEWED",
    targetType: "NORMALIZED_INGEST_EVENT",
    targetId: normalizedEvent.id,
    summary: `Marked normalized ingest event ${normalizedEvent.id} as ${nextStatus}`,
    metadata: {
      normalizedIngestEventId: normalizedEvent.id,
      action: parsed.data.action,
      sourceCategory: normalizedEvent.sourceCategory,
      linkedEventId: exactEvent?.id ?? null,
    },
  });

  revalidatePath(`/${parsed.data.locale}/admin/ingest`);
  revalidatePath(`/${parsed.data.locale}/admin/ingest/submissions`);

  return {
    status: "success",
    message:
      parsed.data.action === "REJECT"
        ? "staged_ingest_event_rejected"
        : parsed.data.action === "MARK_DUPLICATE"
          ? "staged_ingest_event_marked_duplicate"
          : parsed.data.action === "MARK_STALE"
            ? "staged_ingest_event_marked_stale"
            : "staged_ingest_event_marked_superseded",
  };
}
