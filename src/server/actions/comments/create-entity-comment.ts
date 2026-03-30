"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { NotificationType } from "@prisma/client";

import { auth } from "@/auth";
import { NOTIFICATION_ENTITY } from "@/lib/notifications/notification-types";
import { ACTIVITY_ENTITY, ACTIVITY_TYPE } from "@/lib/social/activity-types";
import { getEntityCommentGuard } from "@/lib/rate-limit/social-action-guard";
import { createEntityCommentSchema } from "@/lib/validators/comments";
import { prisma } from "@/lib/prisma";
import { insertActivity } from "@/server/social/insert-activity";
import {
  resolveEventCommentNotificationRecipientIds,
  resolvePlaceCommentNotificationRecipientIds,
} from "@/server/notifications/resolve-comment-notification-recipients";
import { revalidateNotificationSurfaces } from "@/server/queries/notifications/revalidate-notification-paths";
import { buildPublicEventWhere } from "@/server/queries/events/shared";
import { buildPublicPlaceWhere } from "@/server/queries/places/shared";

import { sanitizeReturnPath } from "../places/shared";

import {
  idleEntityCommentActionState,
  type EntityCommentActionState,
} from "./entity-comment-state";

export async function createEntityComment(
  _previousState: EntityCommentActionState = idleEntityCommentActionState,
  formData: FormData,
): Promise<EntityCommentActionState> {
  void _previousState;

  const rawContent = formData.get("content");
  const parsed = createEntityCommentSchema.safeParse({
    locale: formData.get("locale"),
    returnPath: formData.get("returnPath"),
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    content: typeof rawContent === "string" ? rawContent : "",
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const session = await auth();
  const returnPath = sanitizeReturnPath(parsed.data.locale, parsed.data.returnPath);

  if (!session?.user?.id) {
    redirect(`/${parsed.data.locale}/auth/signin?next=${encodeURIComponent(returnPath)}`);
  }

  const { entityType, entityId, content } = parsed.data;

  let placeForNotify: { id: string; ownerUserId: string | null } | null = null;
  let eventForNotify: { id: string } | null = null;

  if (entityType === "place") {
    const place = await prisma.place.findFirst({
      where: buildPublicPlaceWhere({ id: entityId }),
      select: { id: true, slug: true, ownerUserId: true },
    });
    if (!place) {
      return { status: "error", message: "entity_not_found" };
    }
    placeForNotify = place;
  } else {
    const event = await prisma.event.findFirst({
      where: buildPublicEventWhere({ id: entityId }),
      select: { id: true, slug: true },
    });
    if (!event) {
      return { status: "error", message: "entity_not_found" };
    }
    eventForNotify = { id: event.id };
  }

  const commentGuard = await getEntityCommentGuard({
    userId: session.user.id,
    entityType,
    entityId,
    content,
  });
  if (commentGuard) {
    return { status: "error", message: commentGuard };
  }

  await prisma.entityComment.create({
    data: {
      userId: session.user.id,
      entityType,
      entityId,
      content,
    },
  });

  if (entityType === "place" && placeForNotify) {
    const recipientIds = await resolvePlaceCommentNotificationRecipientIds({
      placeId: placeForNotify.id,
      ownerUserId: placeForNotify.ownerUserId,
      actorUserId: session.user.id,
    });
    if (recipientIds.length > 0) {
      await prisma.notification.createMany({
        data: recipientIds.map((userId) => ({
          userId,
          type: NotificationType.COMMENT_ON_MY_CONTENT,
          actorUserId: session.user.id,
          entityType: NOTIFICATION_ENTITY.place,
          entityId: placeForNotify.id,
        })),
      });
      revalidateNotificationSurfaces();
    }
  } else if (entityType === "event" && eventForNotify) {
    const recipientIds = await resolveEventCommentNotificationRecipientIds({
      eventId: eventForNotify.id,
      actorUserId: session.user.id,
    });
    if (recipientIds.length > 0) {
      await prisma.notification.createMany({
        data: recipientIds.map((userId) => ({
          userId,
          type: NotificationType.COMMENT_ON_MY_CONTENT,
          actorUserId: session.user.id,
          entityType: NOTIFICATION_ENTITY.event,
          entityId: eventForNotify.id,
        })),
      });
      revalidateNotificationSurfaces();
    }
  }

  const activityType =
    entityType === "place" ? ACTIVITY_TYPE.COMMENT_PLACE : ACTIVITY_TYPE.COMMENT_EVENT;
  await insertActivity(prisma, {
    userId: session.user.id,
    type: activityType,
    entityType: entityType === "place" ? ACTIVITY_ENTITY.place : ACTIVITY_ENTITY.event,
    entityId,
  });

  revalidatePath(returnPath);
  revalidatePath("/de/feed");
  revalidatePath("/tr/feed");

  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  const un = viewer?.username?.trim();
  if (un) {
    revalidatePath(`/${parsed.data.locale}/user/${un}`);
  }

  return { status: "success" };
}
