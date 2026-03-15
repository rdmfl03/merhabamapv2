"use server";

import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/audit/log-admin-action";
import { prisma } from "@/lib/prisma";
import { updatePlaceTrustSchema } from "@/lib/validators/admin";

import {
  idleAdminActionState,
  requireAdminAccess,
  type AdminActionState,
} from "./shared";

export async function updatePlaceTrustStatus(
  _previousState: AdminActionState = idleAdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = updatePlaceTrustSchema.safeParse({
    locale: formData.get("locale"),
    placeId: formData.get("placeId"),
    nextStatus: formData.get("nextStatus"),
  });

  if (!parsed.success) {
    return { status: "error", message: "validation_error" };
  }

  const actor = await requireAdminAccess(parsed.data.locale);
  const place = await prisma.place.findUnique({
    where: { id: parsed.data.placeId },
    select: {
      id: true,
      verificationStatus: true,
      ownerUserId: true,
    },
  });

  if (!place) {
    return { status: "error", message: "place_not_found" };
  }

  await prisma.place.update({
    where: { id: place.id },
    data: {
      verificationStatus: parsed.data.nextStatus,
      verifiedAt: parsed.data.nextStatus === "VERIFIED" ? new Date() : null,
      verifiedByUserId: parsed.data.nextStatus === "VERIFIED" ? actor.id : null,
      ownerUserId:
        parsed.data.nextStatus === "UNVERIFIED" ? null : place.ownerUserId,
    },
  });

  await logAdminAction({
    actorUserId: actor.id,
    actionType: "PLACE_TRUST_STATUS_UPDATED",
    targetType: "PLACE",
    targetId: place.id,
    summary: `Place trust status changed to ${parsed.data.nextStatus}`,
    metadata: {
      previousStatus: place.verificationStatus,
      nextStatus: parsed.data.nextStatus,
    },
  });

  revalidatePath(`/${parsed.data.locale}/admin`);
  revalidatePath(`/${parsed.data.locale}/admin/places/${place.id}`);
  revalidatePath(`/${parsed.data.locale}/places`);

  return { status: "success", message: "place_updated" };
}
