"use server";

import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/audit/log-admin-action";
import { prisma } from "@/lib/prisma";
import { updateAiModerationSchema } from "@/lib/validators/admin";

import { idleAdminActionState, type AdminActionState } from "./state";
import { requireAdminAccess } from "./shared";

type AiEntityType = "event" | "place";
type AiNextStatus = "OK" | "REVIEW" | "REJECT" | "UNSURE";

type UpdatedEntity = {
  id: string;
  slug: string;
  previousStatus: string | null;
  recheckRequestCreated?: boolean;
};

async function updateEntityAiStatus(
  entityType: AiEntityType,
  entityId: string,
  nextStatus: AiNextStatus,
): Promise<UpdatedEntity | null> {
  const now = new Date();

  if (entityType === "event") {
    const event = await prisma.event.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        slug: true,
        aiReviewStatus: true,
      },
    });

    if (!event) {
      return null;
    }

    await prisma.event.update({
      where: { id: event.id },
      data: {
        aiReviewStatus: nextStatus,
        aiLastCheckedAt: now,
      },
    });

    return {
      id: event.id,
      slug: event.slug,
      previousStatus: event.aiReviewStatus,
    };
  }

  const place = await prisma.place.findUnique({
    where: { id: entityId },
    select: {
      id: true,
      slug: true,
      aiReviewStatus: true,
    },
  });

  if (!place) {
    return null;
  }

  await prisma.place.update({
    where: { id: place.id },
    data: {
      aiReviewStatus: nextStatus,
      aiLastCheckedAt: now,
    },
  });

  return {
    id: place.id,
    slug: place.slug,
    previousStatus: place.aiReviewStatus,
  };
}

export async function markEntityAiOk(entityType: AiEntityType, entityId: string) {
  return updateEntityAiStatus(entityType, entityId, "OK");
}

export async function markEntityAiReview(entityType: AiEntityType, entityId: string) {
  return updateEntityAiStatus(entityType, entityId, "REVIEW");
}

export async function markEntityAiReject(entityType: AiEntityType, entityId: string) {
  return updateEntityAiStatus(entityType, entityId, "REJECT");
}

export async function rerunAiCheck(
  entityType: AiEntityType,
  entityId: string,
  actorId: string,
) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const entity =
      entityType === "event"
        ? await tx.event.findUnique({
            where: { id: entityId },
            select: {
              id: true,
              slug: true,
              aiReviewStatus: true,
            },
          })
        : await tx.place.findUnique({
            where: { id: entityId },
            select: {
              id: true,
              slug: true,
              aiReviewStatus: true,
            },
          });

    if (!entity) {
      return null;
    }

    if (entityType === "event") {
      await tx.event.update({
        where: { id: entity.id },
        data: {
          aiReviewStatus: "UNSURE",
          aiLastCheckedAt: now,
        },
      });
    } else {
      await tx.place.update({
        where: { id: entity.id },
        data: {
          aiReviewStatus: "UNSURE",
          aiLastCheckedAt: now,
        },
      });
    }

    const activeRequest = await tx.aiRecheckRequest.findFirst({
      where: {
        entityType,
        entityId: entity.id,
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
      select: { id: true },
    });

    if (!activeRequest) {
      await tx.aiRecheckRequest.create({
        data: {
          entityType,
          entityId: entity.id,
          requestedByUserId: actorId,
          status: "PENDING",
        },
      });
    }

    return {
      id: entity.id,
      slug: entity.slug,
      previousStatus: entity.aiReviewStatus,
      recheckRequestCreated: !activeRequest,
    };
  });
}

export async function applyAiModerationAction(
  _previousState: AdminActionState = idleAdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  void _previousState;

  const parsed = updateAiModerationSchema.safeParse({
    locale: formData.get("locale"),
    entityType: formData.get("entityType"),
    entityId: formData.get("entityId"),
    action: formData.get("action"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const actor = await requireAdminAccess(parsed.data.locale);

  const entity =
    parsed.data.action === "OK"
      ? await markEntityAiOk(parsed.data.entityType, parsed.data.entityId)
      : parsed.data.action === "REVIEW"
        ? await markEntityAiReview(parsed.data.entityType, parsed.data.entityId)
        : parsed.data.action === "REJECT"
          ? await markEntityAiReject(parsed.data.entityType, parsed.data.entityId)
          : await rerunAiCheck(parsed.data.entityType, parsed.data.entityId, actor.id);

  if (!entity) {
    return { status: "error", message: "entity_not_found" };
  }

  const nextStatus =
    parsed.data.action === "RERUN" ? "UNSURE" : parsed.data.action;

  await logAdminAction({
    actorUserId: actor.id,
    actionType: "AI_REVIEW_STATUS_UPDATED",
    targetType: parsed.data.entityType.toUpperCase(),
    targetId: entity.id,
    summary: `${parsed.data.entityType} AI review status changed to ${nextStatus}`,
    metadata: {
      previousStatus: entity.previousStatus,
      nextStatus,
      action: parsed.data.action,
      recheckRequestCreated: entity.recheckRequestCreated ?? null,
    },
  });

  revalidatePath(`/${parsed.data.locale}/admin`);
  revalidatePath(`/${parsed.data.locale}/admin/ai-review`);

  if (parsed.data.entityType === "event") {
    revalidatePath(`/${parsed.data.locale}/events`);
    revalidatePath(`/${parsed.data.locale}/events/${entity.slug}`);
  } else {
    revalidatePath(`/${parsed.data.locale}/places`);
    revalidatePath(`/${parsed.data.locale}/places/${entity.slug}`);
  }

  return { status: "success", message: "ai_review_updated" };
}
