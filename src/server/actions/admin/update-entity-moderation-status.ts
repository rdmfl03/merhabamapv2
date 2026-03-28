"use server";

import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/audit/log-admin-action";
import { prisma } from "@/lib/prisma";
import { updateEntityModerationSchema } from "@/lib/validators/admin";

import { idleAdminActionState, type AdminActionState } from "./state";
import { requireAdminAccess } from "./shared";

export async function updateEntityModerationStatus(
  _previousState: AdminActionState = idleAdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void _previousState;

  const rejectConfirmationValue = formData.get("rejectConfirmation");

  const parsed = updateEntityModerationSchema.safeParse({
    locale: formData.get("locale"),
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    nextStatus: formData.get("nextStatus"),
    rejectConfirmation:
      typeof rejectConfirmationValue === "string"
        ? rejectConfirmationValue
        : undefined,
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  if (
    parsed.data.nextStatus === "REJECTED" &&
    parsed.data.rejectConfirmation !== "confirmed"
  ) {
    return { status: "error", message: "reject_confirmation_required" };
  }

  const actor = await requireAdminAccess(parsed.data.locale);
  const nextIsPublished = parsed.data.nextStatus === "APPROVED";
  const targetTypeLower = parsed.data.entityType.toLowerCase();
  const adminDetailPath = `/${parsed.data.locale}/admin/${targetTypeLower}s/${parsed.data.entityId}`;
  const publicListPath = `/${parsed.data.locale}/${targetTypeLower}s`;

  if (parsed.data.entityType === "PLACE") {
    const place = await prisma.place.findUnique({
      where: { id: parsed.data.entityId },
      select: {
        id: true,
        slug: true,
        moderationStatus: true,
        isPublished: true,
        city: { select: { slug: true } },
      },
    });

    if (!place) {
      return { status: "error", message: "entity_not_found" };
    }

    await prisma.$transaction([
      prisma.place.update({
        where: { id: place.id },
        data: {
          moderationStatus: parsed.data.nextStatus,
          isPublished: nextIsPublished,
        },
      }),
      prisma.submission.updateMany({
        where: {
          targetEntityType: "PLACE",
          targetEntityId: place.id,
          status: "PENDING",
        },
        data: {
          status: parsed.data.nextStatus,
          reviewedByUserId: actor.id,
          reviewedAt: new Date(),
        },
      }),
    ]);

    await logAdminAction({
      actorUserId: actor.id,
      actionType: "PLACE_MODERATION_UPDATED",
      targetType: "PLACE",
      targetId: place.id,
      summary: `Place moderation changed to ${parsed.data.nextStatus}`,
      metadata: {
        previousModerationStatus: place.moderationStatus,
        previousPublishedState: place.isPublished,
        nextModerationStatus: parsed.data.nextStatus,
        nextPublishedState: nextIsPublished,
      },
    });

    revalidatePath(`/${parsed.data.locale}/admin`);
    revalidatePath(`/${parsed.data.locale}/admin/places`);
    revalidatePath(`/${parsed.data.locale}/admin/ingest`);
    revalidatePath(adminDetailPath);
    revalidatePath(`/${parsed.data.locale}/admin/ingest/submissions`);
    revalidatePath(publicListPath);
    revalidatePath(`/${parsed.data.locale}/places/${place.slug}`);
    revalidatePath(`/${parsed.data.locale}/map`);

    return { status: "success", message: "moderation_updated" };
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.entityId },
    select: {
      id: true,
      slug: true,
      moderationStatus: true,
      isPublished: true,
      city: { select: { slug: true } },
    },
  });

  if (!event) {
    return { status: "error", message: "entity_not_found" };
  }

  await prisma.$transaction([
    prisma.event.update({
      where: { id: event.id },
      data: {
        moderationStatus: parsed.data.nextStatus,
        isPublished: nextIsPublished,
      },
    }),
    prisma.submission.updateMany({
      where: {
        targetEntityType: "EVENT",
        targetEntityId: event.id,
        status: "PENDING",
      },
      data: {
        status: parsed.data.nextStatus,
        reviewedByUserId: actor.id,
        reviewedAt: new Date(),
      },
    }),
  ]);

  await logAdminAction({
    actorUserId: actor.id,
    actionType: "EVENT_MODERATION_UPDATED",
    targetType: "EVENT",
    targetId: event.id,
    summary: `Event moderation changed to ${parsed.data.nextStatus}`,
    metadata: {
      previousModerationStatus: event.moderationStatus,
      previousPublishedState: event.isPublished,
      nextModerationStatus: parsed.data.nextStatus,
      nextPublishedState: nextIsPublished,
    },
  });

  revalidatePath(`/${parsed.data.locale}/admin`);
  revalidatePath(`/${parsed.data.locale}/admin/events`);
  revalidatePath(`/${parsed.data.locale}/admin/ingest`);
  revalidatePath(adminDetailPath);
  revalidatePath(`/${parsed.data.locale}/admin/ingest/submissions`);
  revalidatePath(publicListPath);
  revalidatePath(`/${parsed.data.locale}/events/${event.slug}`);
  revalidatePath(`/${parsed.data.locale}/map`);

  return { status: "success", message: "moderation_updated" };
}
